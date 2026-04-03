🏛️ AI-Powered Grievance Redressal System
🔍 Overview

The AI Grievance Dashboard is an intelligent complaint management system designed to help government officials, citizens, and administrators analyze and respond to public grievances efficiently. It centralizes all complaint data into a single, user-friendly interface and leverages artificial intelligence to summarize, categorize, and extract insights from large volumes of citizen complaints.

Built using Streamlit, FAISS, and transformer-based summarization models, this dashboard integrates both data analytics and conversational AI features to make grievance handling faster, smarter, and more transparent.

⚙️ Key Features

📂 Unified Complaint Data Source:
All complaints (old + new) are automatically merged from data/processed/complaints_cleaned.csv, ensuring a single source of truth.

🧠 AI Complaint Assistant:
A built-in chatbot powered by FAISS and text embeddings that can answer natural queries such as
“What are the major issues in Nathdwara?” or “Tell me about water complaints in Rajasthan.”

🪶 Smart Summarizer:
Uses NLP models to summarize large complaint datasets into concise, human-readable reports. Summaries are auto-saved to data/processed/data_summary.csv.

📊 Visual Dashboard (Streamlit):
Interactive UI to view, filter, and explore complaints by city, category, sub-category, and priority.

💾 Persistent AI Models:
FAISS index and trained models are loaded only once from /models, optimizing performance and preventing reinitialization.

⚡ Real-Time Insights:
The assistant dynamically retrieves similar complaints and generates factual summaries highlighting trends, locations, and categories of issues.

🧩 Tech Stack

Frontend: Streamlit (Python-based UI)

Backend: FAISS, Transformers (for embeddings & summarization)

Database: CSV-based structured complaint data

Libraries: Pandas, NumPy, SentenceTransformers, FAISS, Streamlit

🚀 Outcome

This project demonstrates how AI and data science can be applied to real-world governance challenges. By combining complaint data analytics, intelligent summarization, and natural query understanding, it empowers authorities to make faster, data-driven decisions and improve citizen satisfaction.
