/**
 * AI Routes — /api/ai
 *
 * Exposes grievance-assistant AI features from the
 * AI_Powered_Grievance_Redressal_System-main project:
 *
 *   POST /api/ai/chatbot   — Intent-based Q&A chatbot (qna_faiss.py logic)
 *   POST /api/ai/summarize — Rule-based complaint summarizer (summarizer.py logic)
 *
 * Each endpoint first tries to call the Python ML service (port 8000).
 * If unavailable it falls back to the built-in JS implementations.
 */

import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'hackathon_secret_key_123';
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

async function getFetchImpl() {
    if (typeof globalThis.fetch === 'function') {
        return globalThis.fetch.bind(globalThis);
    }
    const mod = await import('node-fetch');
    return mod.default;
}

// ─── Auth Middleware ────────────────────────────────────────────────────────
const authMiddleware = (req, res, next) => {
    let token = req.cookies?.accessToken;
    if (!token && req.header('Authorization')) {
        token = req.header('Authorization').replace('Bearer ', '');
    }
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// ─── Built-in Chatbot ( adapted from qna_faiss.py ) ──────────────────────────
const CHATBOT_RESPONSES = {
    greeting: (
        "Hello! I'm your AI Grievance Assistant 🤖\n" +
        "I can help with submitting complaints, tracking status, SLA timelines, and more.\n" +
        "What would you like to know?"
    ),
    how_to_submit: (
        "To file a grievance:\n" +
        "1. Click 'File Grievance' in the sidebar\n" +
        "2. Fill in your name, contact, and address\n" +
        "3. Describe the issue in the description box\n" +
        "4. Click 'AI Classify' to auto-detect the department\n" +
        "5. Submit — you'll receive a unique Tracking ID."
    ),
    how_to_update: (
        "To update a complaint:\n" +
        "• Go to 'My Complaints' and select the complaint\n" +
        "• You can only update complaints still in 'Pending' status\n" +
        "• Once assigned to a field officer, edits may be restricted."
    ),
    how_to_delete: (
        "Complaints can be withdrawn before they are assigned to an officer.\n" +
        "Once the status is 'In Review' or beyond, deletion is not allowed.\n" +
        "Contact grievance support if you need urgent assistance."
    ),
    valid_issues: (
        "You can report these public issues:\n" +
        "• ⚡ Electricity / Street Lights\n" +
        "• 💧 Water Supply / Pipe Leaks\n" +
        "• 🛣️ Roads / Potholes\n" +
        "• 🗑️ Garbage / Sanitation\n" +
        "• 🌳 Tree Falls / Public Works\n" +
        "• 🧾 Billing Issues\n" +
        "• 💻 Technical Support\n\n" +
        "Private property disputes are not accepted."
    ),
    response_time: (
        "SLA Response Times:\n" +
        "🔴 Electricity (P0): 4 hours\n" +
        "🟠 Water Supply (P1): 8 hours\n" +
        "🟠 Roads (P1): 12 hours\n" +
        "🟡 Sanitation (P2): 24 hours\n" +
        "🟡 Public Works (P2): 48 hours\n" +
        "🟢 Billing / Logistics (P3): 72 hours\n\n" +
        "Critical/emergency complaints are escalated immediately."
    ),
    track_status: (
        "To track your complaint:\n" +
        "• Go to 'My Complaints' in your dashboard\n" +
        "• Or use the 'Track Status' page with your Tracking ID\n" +
        "• Real-time updates also appear in the Notifications panel."
    ),
    app_info: (
        "This is the AI-Powered Grievance Redressal Portal. Key features:\n" +
        "🤖 BERT/DistilBERT department classification\n" +
        "📊 Sentiment & urgency detection\n" +
        "🗺️ Auto ward detection via GPS\n" +
        "📡 Real-time updates via WebSocket\n" +
        "⏱️ SLA tracking with auto-escalation"
    ),
    escalation: (
        "Escalation happens automatically when SLA is breached.\n" +
        "You can also flag a complaint as 'Urgent' during submission.\n" +
        "Commissioner-level review is triggered for P0/Critical issues."
    ),
    department: (
        "Our AI Engine auto-detects the department from your description.\n" +
        "Departments: Electricity, Water Supply, Roads, Sanitation,\n" +
        "Public Works, Billing, Tech Support.\n" +
        "You can also select a department manually when filing."
    ),
    thanks: "You're welcome! 😊 Is there anything else I can help with?",
};

function detectIntent(query) {
    const q = query.toLowerCase();
    if (/\b(hello|hi\b|hey|good morning|good afternoon|namaste)\b/.test(q)) return 'greeting';
    if (/\b(thank|thanks|thank you|great|awesome|perfect)\b/.test(q)) return 'thanks';
    if (/\b(submit|file|register|raise|create|new complaint|new grievance)\b/.test(q)) return 'how_to_submit';
    if (/\b(update|edit|change|modify)\b/.test(q)) return 'how_to_update';
    if (/\b(delete|cancel|withdraw|remove)\b/.test(q)) return 'how_to_delete';
    if (/\b(valid|what.*report|what.*complain|accept|eligible)\b/.test(q)) return 'valid_issues';
    if (/\b(how long|when.*resolv|sla|deadline|response time|\d+ (days|hours))\b/.test(q)) return 'response_time';
    if (/\b(track|status|check|follow|progress|my complaint)\b/.test(q)) return 'track_status';
    if (/\b(about|what is|how does|portal|website|app|platform|system)\b/.test(q)) return 'app_info';
    if (/\b(escalat|urgent|critical|emergency)\b/.test(q)) return 'escalation';
    if (/\b(department|dept|classify|routing|which dept)\b/.test(q)) return 'department';
    return 'general';
}

// ─── Built-in Summarizer ( adapted from summarizer.py ) ──────────────────────
function smartSummary(text) {
    if (!text || typeof text !== 'string') return '';
    text = text.trim();
    if (text.split(/\s+/).length <= 10) return text;
    const sentences = text.split('.').map(s => s.trim()).filter(Boolean);
    const first = sentences[0] || text.slice(0, 120);
    const lower = text.toLowerCase();
    if (lower.includes('water')) return `Water Issue: ${first}`;
    if (lower.includes('power') || lower.includes('electric') || lower.includes('light')) return `Power/Electricity Issue: ${first}`;
    if (lower.includes('road') || lower.includes('pothole')) return `Road Condition: ${first}`;
    if (lower.includes('garbage') || lower.includes('sewage') || lower.includes('sanitation') || lower.includes('waste')) return `Sanitation Problem: ${first}`;
    if (lower.includes('tree') || lower.includes('park') || lower.includes('public')) return `Public Works: ${first}`;
    if (lower.includes('bill') || lower.includes('payment') || lower.includes('charge')) return `Billing Issue: ${first}`;
    return `General Complaint: ${first}`;
}

// ─── POST /api/ai/chatbot ─────────────────────────────────────────────────────
router.post('/chatbot', authMiddleware, async (req, res) => {
    const { query } = req.body;
    if (!query || !query.trim()) {
        return res.status(400).json({ message: 'query is required' });
    }

    // 1. Try Python ML service first (port 8000)
    try {
        const fetchImpl = await getFetchImpl();
        const mlRes = await fetchImpl(`${ML_SERVICE_URL}/chatbot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
            signal: AbortSignal.timeout(3000),
        });
        if (mlRes.ok) {
            const data = await mlRes.json();
            console.log(`[AI Chatbot] ML service responded, intent: ${data.intent}`);
            return res.json(data);
        }
    } catch (e) {
        console.log('[AI Chatbot] ML service unavailable, using built-in logic:', e.message);
    }

    // 2. Fallback to built-in intent-based responses
    const intent = detectIntent(query);
    const response = CHATBOT_RESPONSES[intent] ||
        "I can help with: filing complaints, tracking status, SLA timelines, " +
        "valid issues, department routing, and escalation. What would you like to know?";

    console.log(`[AI Chatbot] Intent: ${intent}`);
    res.json({ response, intent });
});

// ─── POST /api/ai/summarize ───────────────────────────────────────────────────
router.post('/summarize', authMiddleware, async (req, res) => {
    const { text } = req.body;
    if (!text || !text.trim()) {
        return res.status(400).json({ message: 'text is required' });
    }

    // 1. Try Python ML service first
    try {
        const fetchImpl = await getFetchImpl();
        const mlRes = await fetchImpl(`${ML_SERVICE_URL}/summarize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
            signal: AbortSignal.timeout(3000),
        });
        if (mlRes.ok) {
            const data = await mlRes.json();
            console.log(`[AI Summarize] ML service responded`);
            return res.json(data);
        }
    } catch (e) {
        console.log('[AI Summarize] ML service unavailable, using built-in logic:', e.message);
    }

    // 2. Fallback to built-in rule-based summarizer
    const summary = smartSummary(text);
    res.json({ summary });
});

export default router;
