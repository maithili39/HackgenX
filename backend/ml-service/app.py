"""
ML Microservice for AI Complaint Department Classification & Sentiment Analysis
Based on: Copy of new_BERT_classification.ipynb

Loads:
  1. DistilBERT fine-tuned department classifier (from ./dept_model/)
  2. j-hartmann/emotion-english-distilroberta-base (HuggingFace sentiment)

Falls back to keyword-based classification if models are unavailable.

Run: uvicorn app:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import torch

# ─── App Setup ─────────────────────────────────────────────────────────────────
app = FastAPI(title="AI Complaint Classifier", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Model Loading ─────────────────────────────────────────────────────────────
dept_classifier = None
emotion_pipeline = None

EMOTION_MAP = {
    "anger":    "Angry",
    "fear":     "Concerned",
    "sadness":  "Frustrated",
    "joy":      "Appreciative",
    "neutral":  "Neutral",
    "disgust":  "Furious",
    "surprise": "Concerned",
}

print("[ML Service] Loading models...")

try:
    from transformers import pipeline
    dept_classifier = pipeline(
        "zero-shot-classification", 
        model="typeform/distilbert-base-uncased-mnli"
    )
    print("[ML Service] Zero-shot classifier loaded (typeform/distilbert-base-uncased-mnli)")
except Exception as e:
    print(f"[ML Service] WARN: Could not load zero-shot model: {e} - using keyword fallback")

# Try to load emotion/sentiment pipeline from HuggingFace
try:
    from transformers import pipeline
    emotion_pipeline = pipeline(
        "text-classification",
        model="j-hartmann/emotion-english-distilroberta-base",
        return_all_scores=False,
    )
    print("[ML Service] Emotion/sentiment model loaded (j-hartmann/emotion-english-distilroberta-base)")
except Exception as e:
    print(f"[ML Service] WARN: Could not load emotion model: {e} - using rule-based sentiment")


# ─── Keyword Fallback ───────────────────────────────────────────────────────────
# Compound keywords (multi-word) are listed separately — they get 3x weight
# so a single compound match beats many single-word matches from wrong depts.
COMPOUND_KEYWORDS = {
    "Electricity":  ["street light", "street lights", "street lamp", "street lamps",
                     "lamp post", "lamp posts", "light not working", "lights not working",
                     "no light", "no lights", "no electricity", "power cut", "power outage",
                     "power failure", "short circuit", "live wire", "electric shock"],
    "Water Supply": ["no water", "water supply", "water pipe", "sewage overflow",
                     "water leak", "pipe burst", "water logging"],
    "Roads":        ["road repair", "road damage", "traffic jam", "speed breaker"],
    "Sanitation":   ["garbage collection", "waste disposal", "open defecation",
                     "public toilet", "garbage dump"],
    "Public Works": ["municipal work", "public park", "tree fall", "fallen tree"],
    "Billing":      ["wrong bill", "excess charge", "billing error", "payment failed"],
    "Tech Support": ["tech support", "login issue", "website down", "app not working"],
}

SINGLE_KEYWORDS = {
    "Electricity":  ["electricity", "power", "wire", "electric", "voltage", "blackout",
                     "outage", "transformer", "shock", "current", "streetlight", "streetlights"],
    "Water Supply": ["water", "pipe", "leak", "drain", "sewage", "tap", "flood", "overflow",
                     "pump", "boring", "tanker", "supply"],
    "Roads":        ["road", "pothole", "footpath", "bridge", "traffic", "signal",
                     "construction", "pavement", "divider", "flyover"],
    "Sanitation":   ["garbage", "waste", "sanitation", "toilet", "smell", "trash",
                     "litter", "cleaning", "dustbin", "compost", "sweeping"],
    "Public Works": ["park", "tree", "building", "public", "municipal", "garden",
                     "infrastructure", "maintenance"],
    "Billing":      ["bill", "charge", "refund", "payment", "overcharge", "invoice",
                     "tax", "receipt", "penalty", "fine"],
    "Tech Support": ["app", "website", "portal", "login", "technical", "system",
                     "error", "software", "digital", "online"],
}

URGENCY_WORDS = {
    "high":       ["urgent", "dangerous", "critical", "immediately", "asap", "emergency",
                   "life-threatening", "fire", "accident", "burst", "collapse"],
    "frustrated": ["frustrated", "angry", "unacceptable", "terrible", "worst", "horrible",
                   "disgusting", "pathetic", "fed up"],
    "neutral":    ["please", "kindly", "request", "inform", "suggest"],
}


def keyword_classify_department(text: str) -> tuple[str, float]:
    lower = text.lower()
    scores: dict[str, float] = {}

    # Compound/phrase keywords get weight 3 (more specific, higher priority)
    for dept, phrases in COMPOUND_KEYWORDS.items():
        hit = sum(3 for phrase in phrases if phrase in lower)
        if hit:
            scores[dept] = scores.get(dept, 0) + hit

    # Single keywords get weight 1
    for dept, words in SINGLE_KEYWORDS.items():
        hit = sum(1 for w in words if w in lower)
        if hit:
            scores[dept] = scores.get(dept, 0) + hit

    if scores:
        best = max(scores, key=scores.get)
        confidence = min(0.95, 0.50 + scores[best] * 0.05)
        return best, round(confidence, 2)
    return "Public Works", 0.40


def rule_based_sentiment(text: str) -> str:
    lower = text.lower()
    if any(w in lower for w in URGENCY_WORDS["high"]):
        return "Urgent"
    if any(w in lower for w in URGENCY_WORDS["frustrated"]):
        return "Frustrated"
    if any(w in lower for w in URGENCY_WORDS["neutral"]):
        return "Neutral"
    return "Concerned"


# ─── Core Prediction Functions ─────────────────────────────────────────────────
def predict_department(text: str) -> tuple[str, float]:
    candidate_labels = ["Electricity", "Water Supply", "Roads", "Sanitation", "Public Works", "Billing", "Tech Support"]
    if dept_classifier is not None:
        try:
            result = dept_classifier(text, candidate_labels)
            label = result['labels'][0]
            confidence = result['scores'][0]
            return label, round(confidence, 3)
        except Exception as e:
            print(f"[predict_department] error: {e}")

    return keyword_classify_department(text)


def predict_sentiment(text: str) -> tuple[str, float]:
    """Returns (sentiment_label, confidence)"""
    if emotion_pipeline is not None:
        try:
            result = emotion_pipeline(text[:512])[0]
            raw_label = result["label"].lower()
            score = round(result["score"], 3)
            mapped = EMOTION_MAP.get(raw_label, "Neutral")
            return mapped, score
        except Exception as e:
            print(f"[predict_sentiment] error: {e}")

    label = rule_based_sentiment(text)
    return label, 0.75


# ─── API Models ────────────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    text: str


class PredictResponse(BaseModel):
    department: str
    department_confidence: float
    sentiment: str
    sentiment_confidence: float
    model_used: str


# ─── Endpoints ────────────────────────────────────────────────────────────────
@app.get("/")
def health():
    return {
        "status": "running",
        "dept_model_loaded": dept_classifier is not None,
        "emotion_model_loaded": emotion_pipeline is not None,
    }


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    text = req.text.strip()
    if not text:
        return PredictResponse(
            department="Unknown",
            department_confidence=0.0,
            sentiment="Neutral",
            sentiment_confidence=0.0,
            model_used="none",
        )

    dept, dept_conf = predict_department(text)
    sent, sent_conf = predict_sentiment(text)

    model_flags = []
    if dept_classifier is not None:
        model_flags.append("zero-shot-dept")
    else:
        model_flags.append("keyword-dept")
    if emotion_pipeline is not None:
        model_flags.append("distilroberta-emotion")
    else:
        model_flags.append("rule-emotion")

    return PredictResponse(
        department=dept,
        department_confidence=dept_conf,
        sentiment=sent,
        sentiment_confidence=sent_conf,
        model_used="+".join(model_flags),
    )


# ─── Smart Summarizer (from AI_Powered_Grievance_Redressal_System summarizer.py) ──
class SummarizeRequest(BaseModel):
    text: str


class SummarizeResponse(BaseModel):
    summary: str


def smart_summary(text: str) -> str:
    """
    Rule-based complaint summarizer adapted from
    AI_Powered_Grievance_Redressal_System-main/src/summarizer.py
    """
    if not text or not isinstance(text, str):
        return ""
    text = text.strip()
    words = text.split()
    if len(words) <= 10:
        return text
    sentences = [s.strip() for s in text.split(".") if s.strip()]
    first = sentences[0] if sentences else text[:100]
    lower = text.lower()
    if "water" in lower:
        return f"Water Issue: {first}"
    elif "power" in lower or "electric" in lower or "light" in lower:
        return f"Power/Electricity Issue: {first}"
    elif "road" in lower or "pothole" in lower:
        return f"Road Condition: {first}"
    elif "garbage" in lower or "sewage" in lower or "sanitation" in lower or "waste" in lower:
        return f"Sanitation Problem: {first}"
    elif "tree" in lower or "park" in lower or "public" in lower:
        return f"Public Works: {first}"
    elif "bill" in lower or "payment" in lower or "charge" in lower:
        return f"Billing Issue: {first}"
    else:
        return f"General Complaint: {first}"


@app.post("/summarize", response_model=SummarizeResponse)
def summarize(req: SummarizeRequest):
    """Generates a rule-based smart summary for a complaint text."""
    return SummarizeResponse(summary=smart_summary(req.text.strip()))


# ─── AI Chatbot (from AI_Powered_Grievance_Redressal_System qna_faiss.py) ──────
class ChatRequest(BaseModel):
    query: str


class ChatResponse(BaseModel):
    response: str
    intent: str


_CHATBOT_RESPONSES = {
    "greeting": (
        "Hello! I'm your AI Grievance Assistant 🤖\n"
        "I can help you with submitting complaints, tracking status, "
        "SLA timelines, and more. What would you like to know?"
    ),
    "how_to_submit": (
        "To file a grievance:\n"
        "1. Click 'File Grievance' in the sidebar\n"
        "2. Fill in your name, contact, and address\n"
        "3. Describe the issue in the description box\n"
        "4. Click 'AI Classify' to auto-detect the department\n"
        "5. Submit — you'll receive a unique Tracking ID."
    ),
    "how_to_update": (
        "To update a complaint:\n"
        "• Go to 'My Complaints' and select the complaint\n"
        "• You can only update complaints still in 'Pending' status\n"
        "• Once assigned to a field officer, edits may be restricted."
    ),
    "how_to_delete": (
        "Complaints can be withdrawn before they are assigned to an officer. "
        "Once the status is 'In Review' or beyond, deletion is not allowed."
    ),
    "valid_issues": (
        "You can report these public issues:\n"
        "• Electricity / Street Lights\n"
        "• Water Supply / Pipe Leaks\n"
        "• Roads / Potholes\n"
        "• Garbage / Sanitation\n"
        "• Tree Falls / Public Works\n"
        "• Billing Issues\n"
        "• Technical Support\n\n"
        "Private property disputes are not accepted."
    ),
    "response_time": (
        "SLA Response Times:\n"
        "🔴 Electricity (P0): 4 hours\n"
        "🟠 Water Supply (P1): 8 hours\n"
        "🟠 Roads (P1): 12 hours\n"
        "🟡 Sanitation (P2): 24 hours\n"
        "🟡 Public Works (P2): 48 hours\n"
        "🟢 Billing/Logistics (P3): 72 hours\n\n"
        "Critical complaints are escalated immediately."
    ),
    "track_status": (
        "To track your complaint:\n"
        "• Go to 'My Complaints' in the dashboard\n"
        "• Or use 'Track Status' with your Tracking ID\n"
        "• Real-time updates appear in the Notifications panel."
    ),
    "app_info": (
        "This is the AI-Powered Grievance Redressal Portal. Features:\n"
        "🤖 BERT/DistilBERT department classification\n"
        "📊 Sentiment & urgency detection\n"
        "🗺️ Auto ward detection via GPS\n"
        "📡 Real-time updates via WebSocket\n"
        "⏱️ SLA tracking with auto-escalation"
    ),
    "escalation": (
        "Escalation happens automatically when SLA is breached. "
        "You can also flag a complaint as 'Urgent' at submission. "
        "Commissioner-level review is triggered for P0/Critical issues."
    ),
    "department": (
        "Our AI Engine auto-detects the department from your description. "
        "Departments: Electricity, Water Supply, Roads, Sanitation, "
        "Public Works, Billing, Tech Support. "
        "You can also select manually when filing."
    ),
    "thanks": "You're welcome! 😊 Need anything else? I'm here to help.",
}


def _detect_chatbot_intent(query: str) -> str:
    """
    Intent detection adapted from qna_faiss.py detect_intent().
    """
    q = query.lower()
    if any(w in q for w in ["hello", "hi ", "hi,", "hey", "good morning", "good afternoon", "namaste"]):
        return "greeting"
    if any(w in q for w in ["thank", "thanks", "thank you", "great", "awesome", "perfect"]):
        return "thanks"
    if any(w in q for w in ["submit", "file", "register", "raise", "create new", "new complaint", "new grievance"]):
        return "how_to_submit"
    if any(w in q for w in ["update", "edit", "change", "modify"]):
        return "how_to_update"
    if any(w in q for w in ["delete", "cancel", "withdraw", "remove"]):
        return "how_to_delete"
    if "valid" in q or "what" in q and "report" in q or "accept" in q or "eligible" in q:
        return "valid_issues"
    if any(w in q for w in ["how long", "when", "sla", "deadline", "response time", "days", "hours", "resolv"]):
        return "response_time"
    if any(w in q for w in ["track", "status", "check", "follow", "progress", "my complaint"]):
        return "track_status"
    if any(w in q for w in ["about", "what is", "how does", "portal", "website", "app", "platform", "system"]):
        return "app_info"
    if any(w in q for w in ["escalat", "urgent", "critical", "emergency"]):
        return "escalation"
    if any(w in q for w in ["department", "dept", "classify", "routing", "which dept"]):
        return "department"
    return "general"


@app.post("/chatbot", response_model=ChatResponse)
def chatbot(req: ChatRequest):
    """
    AI chatbot endpoint adapted from qna_faiss.py chatbot() with intent detection
    and static responses for the grievance portal.
    """
    query = req.query.strip()
    if not query:
        return ChatResponse(
            response="Please type a question and I'll do my best to help!",
            intent="empty"
        )
    intent = _detect_chatbot_intent(query)
    response = _CHATBOT_RESPONSES.get(
        intent,
        "I can help with: filing complaints, tracking status, SLA timelines, "
        "valid issues, department routing, and escalation. What would you like to know?"
    )
    return ChatResponse(response=response, intent=intent)


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("ML_PORT", "8000"))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)
