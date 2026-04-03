# dashboard/app.py
import streamlit as st
from pathlib import Path
import pandas as pd
import numpy as np
import joblib
import pickle
import io
import os,sys
from datetime import datetime
from collections import Counter



sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# plotting
import plotly.express as px

# optional libs for PDF
try:
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
    RL_AVAILABLE = True
except Exception:
    RL_AVAILABLE = False

try:
    from fpdf import FPDF
    FPDF_AVAILABLE = True
except Exception:
    FPDF_AVAILABLE = False

# optional heavy libs (only load local folders, do not auto-download)
try:
    import faiss
except Exception:
    faiss = None

try:
    from sentence_transformers import SentenceTransformer
except Exception:
    SentenceTransformer = None

# ---------------- PATHS (your structure) ----------------
BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent  # project root
CSV_PATH = ROOT_DIR / "data" / "processed" / "complaints_cleaned.csv"
FAISS_PKL = ROOT_DIR / "data" / "faiss_data.pkl"
FAISS_INDEX = ROOT_DIR / "data" / "faiss_index.index"
MODEL_DIR = ROOT_DIR / "models"
CATEGORY_PIPELINE = MODEL_DIR / "category_pipeline.pkl"
LABEL_ENCODER = MODEL_DIR / "label_encoder.pkl"
VECTORIZER = MODEL_DIR / "vectorizer.pkl"   # optional, if you have
EMBEDDER_LOCAL = MODEL_DIR / "all-MiniLM-L6-v2"  # local embedder folder
T5_LOCAL = MODEL_DIR / "flan-t5-base"  # not used here (we use src.summarizer)

# summarizer path (your rule-based module)
SUMMARIZER_MODULE = BASE_DIR.parent / "src" / "summarizer.py"

# ensure directories exist
(CSV_PATH.parent).mkdir(parents=True, exist_ok=True)
MODEL_DIR.mkdir(parents=True, exist_ok=True)
(BASE_DIR / "reports").mkdir(parents=True, exist_ok=True)

st.set_page_config(page_title="AI Grievance Dashboard", layout="wide")

# ---------- Helpers ----------

def read_master_df():
    """Always read from CSV to keep single source-of-truth updated."""
    if CSV_PATH.exists():
        try:
            df = pd.read_csv(CSV_PATH)
            return df
        except Exception:
            return pd.DataFrame()
    else:
        # If file missing, return empty DF with expected columns
        cols = ["complaint_id","cleaned_text","category","subcategory","priority","city","state","tags","timestamp","summary"]
        return pd.DataFrame(columns=cols)

def append_row_atomic(csv_path: Path, row: dict):
    """Append a row safely to CSV without overwriting existing data."""
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    if csv_path.exists():
        old = pd.read_csv(csv_path)
    else:
        old = pd.DataFrame()
    new_df = pd.DataFrame([row])
    combined = pd.concat([old, new_df], ignore_index=True)
    tmp = csv_path.with_suffix(".tmp")
    combined.to_csv(tmp, index=False)
    tmp.replace(csv_path)

@st.cache_resource
def load_category_pipeline():
    if CATEGORY_PIPELINE.exists():
        try:
            return joblib.load(CATEGORY_PIPELINE)
        except Exception:
            return None
    return None

@st.cache_resource
def load_label_encoder():
    if LABEL_ENCODER.exists():
        try:
            with open(LABEL_ENCODER, "rb") as f:
                return pickle.load(f)
        except Exception:
            return None
    return None

@st.cache_resource
def load_faiss_index_and_data():
    if faiss is None:
        return None, None
    try:
        if FAISS_INDEX.exists() and FAISS_PKL.exists():
            idx = faiss.read_index(str(FAISS_INDEX))
            data = pickle.load(open(str(FAISS_PKL),"rb"))
            return idx, data
    except Exception:
        return None, None
    return None, None

@st.cache_resource
def load_embedder_local():
    # Only load embedder from local folder if present (do NOT download)
    if EMBEDDER_LOCAL.exists() and SentenceTransformer is not None:
        try:
            return SentenceTransformer(str(EMBEDDER_LOCAL))
        except Exception:
            return None
    return None

# try import smart_summary from src.summarizer if exists
def import_smart_summary():
    try:
        import importlib.util
        spec = importlib.util.spec_from_file_location("summ_module", str(SUMMARIZER_MODULE))
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        if hasattr(mod, "smart_summary"):
            return mod.smart_summary
    except Exception:
        pass
    return None

smart_summary = import_smart_summary()

# Load resources
category_pipeline = load_category_pipeline()
label_encoder = load_label_encoder()
faiss_index, faiss_data = load_faiss_index_and_data()
embedder = load_embedder_local()

# ---------- UI Header ----------
st.markdown("""
# 🏛️ AI-Powered Grievance Redressal System
""")

# ---------- Sidebar ----------
st.sidebar.title("Navigation")
tab = st.sidebar.radio("Go to", ["Home","Submit Complaint","Complaints Insights","AI Assistant","Summarizer","Report"])

st.sidebar.markdown("---")
st.sidebar.write("Status")
st.sidebar.write({
    "csv_exists": str(CSV_PATH.exists()),
    "faiss_index": str(FAISS_INDEX.exists()),
    "faiss_data": str(FAISS_PKL.exists()),
    "category_pipeline": str(CATEGORY_PIPELINE.exists()),
    "label_encoder": str(LABEL_ENCODER.exists()),
    "embedder_local": str(EMBEDDER_LOCAL.exists())
})

# ---------- TAB: Submit Complaint ----------
# ---------- TAB: Home ----------
if tab == "Home":
    st.title("🏠 Welcome to AI-Powered Grievance Redressal System ")
    st.markdown("""
    ### 📋 Overview  
    This system helps submit,analyze and summarize public grievances efficiently.
    
    **Modules available:**
    - 📝 **Submit Complaint** — Add new complaints and auto-categorize them.
    - 📈 **Complaints Insights** — Visualize trends, categories, and priority analytics.
    -  🤖   **AI Assistant** — Interacts with users and answers queries using complaint data.
    - 🧾 **Summarizer** — Generate concise summaries of all complaint texts.
    - 📄 **Report** — Export insights and summaries into PDFs or CSVs.

    ---
    ### 💾 Data Location
    All data is stored at:
    `data/processed/complaints_cleaned.csv`

    ---
     Use the sidebar to navigate between sections.
    """)

elif tab == "Submit Complaint":
    st.header("📝 Submit Complaint")
    df = read_master_df()  # always fresh

    # smart city dropdown from existing cities
    existing_cities = sorted(df['city'].dropna().unique().tolist()) if 'city' in df.columns and not df['city'].dropna().empty else []
    city_select = st.selectbox("Select city (or type new)", options=[""] + existing_cities)
    if city_select == "":
        city = st.text_input("City")
    else:
        city = city_select

    # optional state and tags (if present in CSV)
    state = st.text_input("State (optional)")
    tags = st.text_input("Tags (optional)")

    # complaint text
    complaint_text = st.text_area("Describe your complaint", height=180)

    # If user wants to use model prediction for category
    use_model_pred = st.checkbox("Auto-predict category using saved pipeline (if available)", value=True)

    priority_opt = st.selectbox("Priority (if not predicted)", ["low","medium","high"], index=1)

    if st.button("Submit Complaint"):
        if not complaint_text.strip() or not city.strip():
            st.warning("Please enter both complaint text and city.")
        else:
            # prepare new row
            new_id = int(datetime.now().timestamp() * 1000)
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            # Predict category using pipeline if available and chosen
            cat = ""
            subcat = ""
            prio = priority_opt
            if use_model_pred and category_pipeline is not None:
                try:
                    pred = category_pipeline.predict([complaint_text])[0]
                    # if label_encoder available, try to get readable label
                    if label_encoder is not None:
                        try:
                            # if pred numeric label
                            if isinstance(pred, (int, np.integer)):
                                cat = label_encoder.inverse_transform([pred])[0]
                            else:
                                cat = pred
                        except Exception:
                            cat = pred
                    else:
                        cat = pred
                except Exception:
                    cat = ""
            # fallback heuristics if no prediction
            if not cat:
                lower = complaint_text.lower()
                if any(k in lower for k in ["water","tap","pressure","contaminat"]):
                    cat = "water"
                elif any(k in lower for k in ["power","electric","voltage","transformer"]):
                    cat = "electricity"
                elif any(k in lower for k in ["pothole","road","traffic","speed breaker"]):
                    cat = "roads"
                elif any(k in lower for k in ["garbage","drain","toilet","sewage"]):
                    cat = "sanitation"
                else:
                    cat = "other"

            row = {
                "complaint_id": new_id,
                "cleaned_text": complaint_text.strip(),
                "category": cat,
                "subcategory": subcat,
                "priority": prio,
                "city": city.strip(),
                "state": state.strip(),
                "tags": tags.strip(),
                "timestamp": timestamp
            }
            append_row_atomic(CSV_PATH, row)
            st.success(f"Complaint submitted and saved (ID: {new_id}).")
            st.rerun()


# ---------- TAB: Complaints Insights ----------
elif tab == "Complaints Insights":
    st.header("📈 Complaints Insights")
    df = read_master_df()
    if df.empty:
        st.info("No complaints available.")
    else:
    # filters
        with st.expander("Filters"):
            cats = ["All"] + sorted(df['category'].dropna().unique().tolist()) if 'category' in df.columns else ["All"]
            cities = ["All"] + sorted(df['city'].dropna().unique().tolist()) if 'city' in df.columns else ["All"]
            prios = ["All"] + sorted(df['priority'].dropna().unique().tolist()) if 'priority' in df.columns else ["All"]
            cat_sel = st.selectbox("Category", cats, index=0)
            city_sel = st.selectbox("City", cities, index=0)
            prio_sel = st.selectbox("Priority", prios, index=0)

            # date filter if timestamp column exists
            if 'timestamp' in df.columns:
                try:
                    df['timestamp'] = pd.to_datetime(df['timestamp'])
                    min_d = df['timestamp'].min().date()
                    max_d = df['timestamp'].max().date()
                    date_range = st.date_input("Date range", value=(min_d, max_d), min_value=min_d, max_value=max_d)
                except Exception:
                    date_range = None
            else:
                date_range = None

        # apply filters
        dff = df.copy()
        if cat_sel != "All":
            dff = dff[dff['category'] == cat_sel]
        if city_sel != "All":
            dff = dff[dff['city'] == city_sel]
        if prio_sel != "All":
            dff = dff[dff['priority'] == prio_sel]
        if date_range is not None:
            start, end = pd.to_datetime(date_range[0]), pd.to_datetime(date_range[1])
            dff = dff[(dff['timestamp'] >= pd.Timestamp(start)) & (dff['timestamp'] <= pd.Timestamp(end) + pd.Timedelta(days=1))]

        st.subheader("High-level metrics")
        cols = st.columns(4)
        cols[0].metric("Total complaints", len(dff))
        cols[1].metric("Unique cities", dff['city'].nunique() if 'city' in dff.columns else 0)
        cols[2].metric("Unique categories", dff['category'].nunique() if 'category' in dff.columns else 0)
        cols[3].metric("High priority", int((dff['priority']=='high').sum()) if 'priority' in dff.columns else 0)

        st.markdown("---")

        # --- ✅ Interactive Charts ---
        if 'category' in dff.columns:
            cat_counts = (
                dff['category']
                .value_counts()
                .reset_index()
                .rename(columns={'index': 'category', 'category': 'count'})
            )
            cat_counts.columns = ['category', 'count']  # Ensures unique names

            fig1 = px.bar(
                cat_counts,
                x='category',
                y='count',
                title='Complaints by Category',
                text='count'
            )
            fig1.update_traces(texttemplate='%{text}', textposition='outside')
            fig1.update_layout(xaxis_title='Category', yaxis_title='Number of Complaints')
            st.plotly_chart(fig1, use_container_width=True)

        if 'city' in dff.columns:
            city_counts = (
                dff['city']
                .value_counts()
                .reset_index()
                .rename(columns={'index': 'city', 'city': 'count'})
            )
            city_counts.columns = ['city', 'count']

            fig2 = px.bar(
                city_counts,
                x='city',
                y='count',
                title='Complaints by City',
                text='count'
            )
            fig2.update_traces(texttemplate='%{text}', textposition='outside')
            fig2.update_layout(xaxis_title='City', yaxis_title='Number of Complaints')
            st.plotly_chart(fig2, use_container_width=True)

        if 'priority' in dff.columns:
            fig3 = px.pie(dff, names='priority', title='Priority Distribution')
            st.plotly_chart(fig3, use_container_width=True)

        # --- Sample Complaints ---
        st.markdown("### Sample Complaints")
        cols = ['complaint_id','cleaned_text','category','priority','city','timestamp']
        cols_available = [c for c in cols if c in dff.columns]
        st.dataframe(dff[cols_available].head(200), use_container_width=True)

        # --- Download filtered CSV ---
        csv_bytes = dff.to_csv(index=False).encode('utf-8')
        st.download_button("⬇️ Download filtered CSV", data=csv_bytes, file_name="complaints_filtered.csv", mime="text/csv")

# ---------- TAB: AI Assistant ----------
# ---- TAB: AI Assistant ----------
elif tab == "AI Assistant":
    st.header("🤖 AI Complaint Assistant")

    st.markdown("""
        This assistant can answer queries about public complaints, trends, and summaries  
        using the **real dataset** from `complaints_cleaned.csv`.  
        It intelligently retrieves similar complaints via **FAISS** and generates natural summaries.  
    """)

    user_q = st.text_input("Ask something about complaints (e.g., 'water issues in Ahmedabad')")

    if st.button("Ask"):
        if not user_q.strip():
            st.warning("Please enter a question.")
        else:
            try:
                from src.qna_faiss import chatbot
                with st.spinner("Thinking..."):
                    response = chatbot(user_q)
                st.subheader("🤖 Assistant's Response")
                st.write(response)
            except Exception as e:
                st.error(f"Error while processing query: {e}")

    st.markdown("---")
    st.caption("⚙️ Powered by FAISS + MiniLM + FLAN-T5 | Uses existing models without retraining")


# ---------- TAB: Summarizer ----------
elif tab == "Summarizer":
    st.header("🧾 Summarizer (rule-based)")
    df = read_master_df()
    if df.empty:
        st.info("No complaints to summarize.")
    else:
        st.write("This uses your `src/summarizer.py` smart_summary function (rule-based).")
        if st.button("Generate summaries for all complaints"):
            if smart_summary is None:
                st.error("No summarizer function found at src/summarizer.py (expect smart_summary).")
            else:
                try:
                    # apply smart_summary to cleaned_text or Complaint columns
                    if 'cleaned_text' in df.columns:
                        df['summary'] = df['cleaned_text'].astype(str).apply(smart_summary)
                    elif 'Complaint' in df.columns:
                        df['summary'] = df['Complaint'].astype(str).apply(smart_summary)
                    else:
                        st.error("No text column found to summarize.")
                        raise ValueError("no text column")

                    # save summarized CSV to data/processed/data_summary.csv (user asked earlier)
                    out_path = CSV_PATH.parent / "data_summary.csv"
                    df.to_csv(out_path, index=False)
                    # also update master CSV (so summary exists in master)
                    df.to_csv(CSV_PATH, index=False)
                    st.success(f"Summaries generated and saved to {out_path.name}")

                    # preview & download
                    st.dataframe(df[['cleaned_text','summary']].head(20))
                    with open(out_path, "rb") as f:
                        st.download_button("⬇️ Download Summarized CSV", data=f, file_name="data_summary.csv", mime="text/csv")
                except Exception as e:
                    st.error(f"Failed to generate summaries: {e}")

# ---------- TAB: Report ----------
elif tab == "Report":
    st.header("📄 Interactive Report & PDF Export")
    df = read_master_df()
    if df.empty:
        st.info("No data to generate reports.")
    else:
        # filters same as Analytics
        with st.expander("Report filters"):
            cats = ["All"] + sorted(df['category'].dropna().unique().tolist()) if 'category' in df.columns else ["All"]
            cities = ["All"] + sorted(df['city'].dropna().unique().tolist()) if 'city' in df.columns else ["All"]
            cat_sel = st.selectbox("Category", cats)
            city_sel = st.selectbox("City", cities)
            prios = ["All"] + sorted(df['priority'].dropna().unique().tolist()) if 'priority' in df.columns else ["All"]
            prio_sel = st.selectbox("Priority", prios)
            rows_limit = st.number_input("Max rows in PDF", min_value=10, max_value=2000, value=200)

        rdf = df.copy()
        if cat_sel != "All":
            rdf = rdf[rdf['category']==cat_sel]
        if city_sel != "All":
            rdf = rdf[rdf['city']==city_sel]
        if prio_sel != "All":
            rdf = rdf[rdf['priority']==prio_sel]

        # Interactive charts for report
        st.subheader("Interactive charts (for report)")
        if 'category' in rdf.columns:
            cat_counts = (
                rdf['category']
                .value_counts()
                .reset_index()
            )
            cat_counts.columns = ['category', 'count']  # ensures unique names

            fig = px.bar(cat_counts, x='category', y='count', title='Category distribution (report)')
            st.plotly_chart(fig, use_container_width=True)
            

        if 'city' in rdf.columns:
            city_counts = rdf['city'].value_counts().reset_index()
            city_counts.columns = ['city', 'count']
            fig2 = px.bar(city_counts, x='city', y='count', title='City distribution (report)')
            st.plotly_chart(fig2, use_container_width=True)


        # Download filtered CSV for report
        csv_bytes = rdf.to_csv(index=False).encode('utf-8')
        st.download_button("⬇️ Download report CSV", data=csv_bytes, file_name="report_filtered.csv", mime="text/csv")

        # Generate PDF from filtered df
        if st.button("Generate PDF Report (downloadable)"):
            try:
                pdf_buffer = io.BytesIO()
                use_path = CSV_PATH.parent / f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"

                # prefer reportlab if available (better formatting)
                if RL_AVAILABLE:
                    doc = SimpleDocTemplate(pdf_buffer, pagesize=A4)
                    styles = getSampleStyleSheet()
                    story = [Paragraph("Grievance Report", styles["Title"]), Spacer(1, 12)]
                    # include summary if present
                    for _, r in rdf.head(int(rows_limit)).iterrows():
                        text = f"<b>ID:</b> {r.get('complaint_id','')} <b>City:</b> {r.get('city','')} <b>Category:</b> {r.get('category','')}<br/>"
                        text += f"<b>Priority:</b> {r.get('priority','')}<br/>"
                        text += f"<b>Text:</b> {str(r.get('cleaned_text',''))[:300]}<br/>"
                        if 'summary' in r.index and pd.notna(r['summary']):
                            text += f"<b>Summary:</b> {r.get('summary','')}<br/>"
                        text += "<br/>"
                        story.append(Paragraph(text, styles["Normal"]))
                        story.append(Spacer(1,6))
                    doc.build(story)
                    pdf_buffer.seek(0)
                    st.download_button("⬇️ Download PDF Report", data=pdf_buffer, file_name=use_path.name, mime="application/pdf")
                elif FPDF_AVAILABLE:
                    pdf = FPDF()
                    pdf.set_auto_page_break(auto=True, margin=15)
                    pdf.add_page()
                    pdf.set_font("Arial", 'B', 16)
                    pdf.cell(0,10,"Grievance Report", ln=True, align='C')
                    pdf.ln(6)
                    for _, r in rdf.head(int(rows_limit)).iterrows():
                        pdf.set_font("Arial",'B',11)
                        pdf.cell(0,8, f"ID: {r.get('complaint_id','')} | City: {r.get('city','')} | Category: {r.get('category','')}", ln=True)
                        pdf.set_font("Arial",'',10)
                        txt = str(r.get('cleaned_text',''))[:400]
                        pdf.multi_cell(0,8, f"Text: {txt}")
                        if 'summary' in r.index and pd.notna(r['summary']):
                            pdf.multi_cell(0,8, f"Summary: {r.get('summary','')}")
                        pdf.ln(4)
                    pdf_buffer = io.BytesIO(pdf.output(dest='S').encode('latin1'))
                    st.download_button("⬇️ Download PDF Report", data=pdf_buffer, file_name=f"{use_path.name}", mime="application/pdf")
                else:
                    st.error("No PDF library available (install reportlab or fpdf).")
            except Exception as e:
                st.error(f"Failed to generate PDF: {e}")

# footer
st.markdown("---")
st.caption("Local demo — uses your saved models & FAISS. No retrain. All changes persist to data/processed/complaints_cleaned.csv")
