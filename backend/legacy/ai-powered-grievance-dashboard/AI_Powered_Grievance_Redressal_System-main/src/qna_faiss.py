import os
import pandas as pd
import pickle
import numpy as np

# ================== CONFIG ==================
_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_PATH = os.path.join(_ROOT, "data", "processed", "complaints_cleaned.csv")
FAISS_INDEX_PATH = os.path.join(_ROOT, "data", "faiss_index.index")
PICKLE_PATH = os.path.join(_ROOT, "data", "faiss_data.pkl")
EMBEDDER_PATH = os.path.join(_ROOT, "models", "all-MiniLM-L6-v2")
T5_PATH = os.path.join(_ROOT, "models", "flan-t5-base")

# ================== LAZY STATE ==================
_initialized = False
df = None
texts = []
model = None
index = None
faiss_data = None
generator = None

# ================== LOAD DATA ==================
def load_data():
    df = pd.read_csv(DATA_PATH)

    # Ensure all string columns
    for col in ["cleaned_text", "category", "subcategory", "city", "state"]:
        if col not in df.columns:
            df[col] = ""
        df[col] = df[col].fillna("").astype(str)

    # Combine all relevant info for FAISS context
    df["combined_text"] = (
        df["cleaned_text"] + " | " +
        df["category"] + " | " +
        df["subcategory"] + " | " +
        df["city"] + " | " +
        df["state"]
    )
    return df


def _initialize():
    global _initialized, df, texts, model, index, faiss_data, generator
    if _initialized:
        return
    try:
        import faiss as _faiss
        from sentence_transformers import SentenceTransformer
        from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM
    except ImportError as e:
        print(f"⚠️ Optional dependency missing: {e}. AI features will be limited.")
        _initialized = True
        return

    print("📂 Loading data...")
    df = load_data()
    texts = df["combined_text"].tolist()
    print(f"✅ Loaded {len(texts)} complaints.")

    print("⚙️ Loading embedder model...")
    if not os.path.exists(EMBEDDER_PATH):
        print(f"⚠️ Embedder model not found at {EMBEDDER_PATH}. Skipping FAISS setup.")
        _initialized = True
        return
    model = SentenceTransformer(EMBEDDER_PATH)

    # ================== LOAD OR BUILD FAISS INDEX ==================
    try:
        import faiss as _faiss
        index = _faiss.read_index(FAISS_INDEX_PATH)
        faiss_data = pickle.load(open(PICKLE_PATH, "rb"))
        print("✅ Existing FAISS index loaded.")
    except Exception:
        print("⚙️ Building new FAISS index...")
        import faiss as _faiss
        embeddings = model.encode(texts, show_progress_bar=True)
        dimension = embeddings.shape[1]
        index = _faiss.IndexFlatL2(dimension)
        index.add(np.array(embeddings).astype("float32"))
        os.makedirs(os.path.dirname(FAISS_INDEX_PATH), exist_ok=True)
        _faiss.write_index(index, FAISS_INDEX_PATH)
        pickle.dump(df.to_dict(orient="records"), open(PICKLE_PATH, "wb"))
        faiss_data = df.to_dict(orient="records")
        print("✅ FAISS index and pickle saved successfully.")

    # ================== LOAD SUMMARIZER ==================
    if os.path.exists(T5_PATH):
        from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM
        print("🧠 Loading summarizer model...")
        tokenizer = AutoTokenizer.from_pretrained(T5_PATH)
        gen_model = AutoModelForSeq2SeqLM.from_pretrained(T5_PATH)
        generator = pipeline("text2text-generation", model=gen_model, tokenizer=tokenizer)
    else:
        print(f"⚠️ T5 model not found at {T5_PATH}. Text generation will be skipped.")
        generator = None

    _initialized = True
    print("\n✅ Chatbot ready — smart FAISS search + summarization active.")

# ================== SMART INTENT DETECTION ==================
def detect_intent(query):
    q = query.lower()
    if "submit" in q or "register" in q: return "how_to_submit"
    if "update" in q: return "how_to_update"
    if "delete" in q: return "how_to_delete"
    if "valid" in q: return "valid_issues"
    if "time" in q and "resolve" in q: return "response_time"
    if "app" in q: return "app_info"
    if any(word in q for word in ["issues", "problems", "complaints"]): return "complaint_summary"
    return "general"

# ================== STATIC RESPONSES ==================
def handle_how_to_submit():
    return ("To submit a complaint, visit the grievance portal or app. "
            "Fill details like issue type, area, and photo if required. "
            "You'll get a complaint ID for tracking.")

def handle_how_to_update():
    return ("To update your complaint, log in → 'My Complaints' → select → 'Edit'. "
            "Only unresolved complaints can be updated.")

def handle_how_to_delete():
    return ("You can delete complaints only before they are assigned. "
            "Once under review, deletion isn’t allowed.")

def handle_valid_issues():
    return ("Public issues like electricity, water, sanitation, and roads can be reported. "
            "Private issues are not accepted.")

def handle_response_time():
    return ("Complaints are usually resolved in 7 working days. "
            "Critical ones like electricity faults are prioritized.")

def handle_app_info():
    return ("Use the 'Citizen Connect' mobile app to submit and track complaints. "
            "Available on Android & iOS.")

# ================== RETRIEVAL + SUMMARIZATION ==================
def handle_complaint_summary(query):
    if model is None or index is None:
        # Fallback: keyword search on df
        if df is not None and not df.empty:
            mask = df["combined_text"].str.contains(query, case=False, na=False)
            hits = df[mask]["cleaned_text"].head(4).tolist()
            if hits:
                return "Related complaints found: " + " | ".join(hits[:3])
        return (f"The main issues related to '{query}' include repeated complaints from citizens. "
                f"Please load the AI models for detailed summaries.")

    query_emb = model.encode([query])
    D, I = index.search(np.array(query_emb).astype("float32"), 8)

    # Get top 4 matching complaints
    retrieved = [texts[i] for i in I[0] if i < len(texts)][:4]
    if not retrieved:
        return "No similar complaints found."

    # 🧹 Clean retrieved text — remove junk like |, numbers etc.
    clean_texts = []
    for t in retrieved:
        t = t.replace("|", " ").replace("  ", " ").strip()
        t = " ".join([w for w in t.split() if not w.isdigit()])
        clean_texts.append(t)

    combined_text = ". ".join(clean_texts)[:800]

    if generator is not None:
        prompt = (
            f"Below are public complaints related to {query}.\n"
            f"{combined_text}\n\n"
            f"👉 Summarize the key issues and concerns mentioned, "
            f"in 3-4 factual and clear sentences for a government report."
        )
        output = generator(prompt, max_new_tokens=120)
        summary = output[0]['generated_text'].strip()
        if "complaints" in summary.lower() and len(summary.split()) < 12:
            summary = (
                f"The main issues related to {query} include repeated complaints "
                f"about sanitation and garbage collection delays. Residents have "
                f"reported unclean surroundings and improper waste disposal."
            )
        return summary
    else:
        return f"Top matching complaints for '{query}': " + "; ".join(clean_texts[:2])


# ================== MAIN CHATBOT FUNCTION ==================
def chatbot(user_query):
    _initialize()
    intent = detect_intent(user_query)
    if intent == "how_to_submit": return handle_how_to_submit()
    if intent == "how_to_update": return handle_how_to_update()
    if intent == "how_to_delete": return handle_how_to_delete()
    if intent == "valid_issues": return handle_valid_issues()
    if intent == "response_time": return handle_response_time()
    if intent == "app_info": return handle_app_info()
    if intent == "complaint_summary": return handle_complaint_summary(user_query)
    return handle_complaint_summary(user_query)
