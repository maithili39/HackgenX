import express from 'express';
import jwt from 'jsonwebtoken';
import { Complaint } from '../models/Complaint.js';
import { User } from '../models/User.js';
import { DeptMapping } from '../models/DeptMapping.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'hackathon_secret_key_123';

// ─── Auth Middleware ──────────────────────────────────────────────────────────
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// ─── Priority & SLA Mapping ───────────────────────────────────────────────────
const PRIORITY_RULES = {
    'Electricity': { priority: 'P0', slaMins: 240 },   // 4 hours
    'Water Supply': { priority: 'P1', slaMins: 480 },   // 8 hours
    'Roads': { priority: 'P1', slaMins: 720 },          // 12 hours
    'Sanitation': { priority: 'P2', slaMins: 1440 },    // 24 hours
    'Public Works': { priority: 'P2', slaMins: 2880 },  // 48 hours
    'Logistics': { priority: 'P3', slaMins: 4320 },     // 72 hours
    'Billing': { priority: 'P3', slaMins: 4320 },
    'Tech Support': { priority: 'P2', slaMins: 1440 },
    'default': { priority: 'P2', slaMins: 1440 }
};

function getSlaForDepartment(dept) {
    const rule = PRIORITY_RULES[dept] || PRIORITY_RULES['default'];
    const slaDeadline = new Date(Date.now() + rule.slaMins * 60 * 1000);
    return { priority: rule.priority, slaDeadline };
}

// ─── AI Classification (Python ML → Gemini → Keyword fallback) ────────────────
async function classifyComplaint(description, department) {
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

    // Compound phrases (weight 3) checked before single words (weight 1)
    const compoundKeywords = {
        'Electricity': ['street light', 'street lights', 'street lamp', 'street lamps',
            'lamp post', 'lamp posts', 'no light', 'no lights', 'no electricity',
            'power cut', 'power outage', 'power failure', 'short circuit',
            'live wire', 'electric shock', 'light not working', 'lights not working'],
        'Water Supply': ['no water', 'water supply', 'water pipe', 'sewage overflow',
            'water leak', 'pipe burst', 'water logging'],
        'Roads': ['road repair', 'road damage', 'traffic jam', 'speed breaker'],
        'Sanitation': ['garbage collection', 'waste disposal', 'garbage dump', 'public toilet'],
        'Public Works': ['tree fall', 'fallen tree', 'public park', 'municipal work'],
        'Billing': ['wrong bill', 'excess charge', 'billing error', 'payment failed'],
        'Tech Support': ['login issue', 'website down', 'app not working', 'tech support'],
    };
    const singleKeywords = {
        'Electricity': ['electricity', 'power', 'wire', 'electric', 'voltage', 'blackout', 'outage', 'transformer', 'shock', 'streetlight'],
        'Water Supply': ['water', 'pipe', 'leak', 'drain', 'sewage', 'tap', 'flood', 'overflow', 'pump'],
        'Roads': ['road', 'pothole', 'footpath', 'bridge', 'traffic', 'signal', 'construction'],
        'Sanitation': ['garbage', 'waste', 'sanitation', 'toilet', 'smell', 'trash', 'litter', 'cleaning'],
        'Public Works': ['park', 'tree', 'building', 'public', 'municipal'],
        'Billing': ['bill', 'charge', 'refund', 'payment', 'overcharge', 'invoice'],
        'Tech Support': ['app', 'website', 'portal', 'login', 'technical', 'system']
    };

    const lower = description.toLowerCase();
    const deptScores = {};
    for (const [dept, phrases] of Object.entries(compoundKeywords)) {
        const hit = phrases.filter(p => lower.includes(p)).length * 3;
        if (hit) deptScores[dept] = (deptScores[dept] || 0) + hit;
    }
    for (const [dept, words] of Object.entries(singleKeywords)) {
        const hit = words.filter(w => lower.includes(w)).length;
        if (hit) deptScores[dept] = (deptScores[dept] || 0) + hit;
    }

    // Detect department if not set (keyword fallback baseline)
    let detectedDept = department && department !== 'Pending Analysis' ? department : null;
    if (!detectedDept) {
        if (Object.keys(deptScores).length > 0) {
            detectedDept = Object.entries(deptScores).sort((a, b) => b[1] - a[1])[0][0];
        } else {
            detectedDept = 'Public Works';
        }
    }

    let emotion = 'Concerned';
    let riskLevel = 'Medium';
    const urgentKeywords = ['dangerous', 'live wire', 'accident', 'fire', 'emergency', 'collapse', 'injury', 'flooding'];
    const highKeywords = ['no electricity', 'no water', 'pothole', 'sewage overflow', 'blackout'];
    const lowKeywords = ['minor', 'small', 'slight', 'little'];
    if (urgentKeywords.some(w => lower.includes(w))) riskLevel = 'Critical';
    else if (highKeywords.some(w => lower.includes(w))) riskLevel = 'High';
    else if (lowKeywords.some(w => lower.includes(w))) riskLevel = 'Low';

    let aiSummary = `Complaint classified under ${detectedDept}. Severity: ${riskLevel}. Citizen sentiment: ${emotion}.`;

    // ─── 1. Try Python DistilBERT ML Service (primary) ───────────────────────
    try {
        const fetch = (await import('node-fetch')).default;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        const mlRes = await fetch(`${ML_SERVICE_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: description }),
            signal: controller.signal
        });
        clearTimeout(timer);
        if (mlRes.ok) {
            const mlData = await mlRes.json();
            if (!department || department === 'Pending Analysis') detectedDept = mlData.department || detectedDept;
            emotion = mlData.sentiment || emotion;
            aiSummary = `[BERT] Classified as ${detectedDept}. Sentiment: ${emotion}. Severity: ${riskLevel}.`;
            console.log(`[ML Service] Dept: ${detectedDept} | Sentiment: ${emotion} | Model: ${mlData.model_used}`);
            return { department: detectedDept, riskLevel, emotion, aiSummary };
        }
    } catch (e) {
        console.log('[ML Service] Not available, falling back:', e.message);
    }

    // ─── 2. Try Gemini if ML service is unavailable ───────────────────────────
    if (GEMINI_KEY) {
        try {
            const fetch = (await import('node-fetch')).default;
            const prompt = `You are a government complaint classifier. Analyze this complaint and respond with ONLY a JSON object (no markdown, no explanation):\n{"department": "one of [Electricity, Water Supply, Roads, Sanitation, Public Works, Billing, Tech Support]", "riskLevel": "one of [Low, Medium, High, Critical]", "emotion": "one of [Neutral, Concerned, Frustrated, Urgent]", "summary": "one sentence summary"}\n\nComplaint: "${description}"`;
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
                { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
            );
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
            if (parsed.department) detectedDept = parsed.department;
            if (parsed.riskLevel) riskLevel = parsed.riskLevel;
            if (parsed.emotion) emotion = parsed.emotion;
            if (parsed.summary) aiSummary = parsed.summary;
        } catch (e) {
            console.log('Gemini fallback to keyword classification:', e.message);
        }
    }

    return { department: detectedDept, riskLevel, emotion, aiSummary };
}

// ─── Duplicate Detection ──────────────────────────────────────────────────────
async function findDuplicate(lat, lng, description) {
    if (!lat || !lng) return null;
    const radiusKm = 0.5; // 500m
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

    const recentCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48hrs

    const nearby = await Complaint.findOne({
        'location.lat': { $gte: lat - latDelta, $lte: lat + latDelta },
        'location.lng': { $gte: lng - lngDelta, $lte: lng + lngDelta },
        createdAt: { $gte: recentCutoff },
        isDuplicate: false
    });

    return nearby || null;
}

// ─── Haversine GPS Distance (metres) ─────────────────────────────────────────
function getDistanceMetres(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ── Classify only (for live AI preview in frontend) ──
router.post('/classify', authMiddleware, async (req, res) => {
    try {
        const { description, department } = req.body;
        const result = await classifyComplaint(description, department);
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: 'Classification error' });
    }
});

// ── Citizen: Submit complaint ─────────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { description, name, contact, homeAddress, department, photo, location } = req.body;

        const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        const complaintId = `CMP-${datePart}-${randomPart}`;

        // Check for duplicate
        let isDuplicate = false;
        let duplicateOf = null;
        if (location?.lat && location?.lng) {
            const dup = await findDuplicate(location.lat, location.lng, description);
            if (dup) { isDuplicate = true; duplicateOf = dup._id; }
        }

        const newComplaint = new Complaint({
            userId: req.user.userId,
            complaintId,
            name,
            contact,
            homeAddress,
            description,
            department: department || 'Pending Analysis',
            photo: photo || null,
            location: location || null,
            beforePhoto: photo || null,
            isDuplicate,
            duplicateOf,
            auditLog: [{
                action: 'Complaint Submitted',
                performedBy: name,
                performedByRole: 'citizen',
                note: `Complaint registered with ID ${complaintId}`
            }]
        });

        await newComplaint.save();

        // AI Classification + Auto-Assignment async
        setTimeout(async () => {
            try {
                const ai = await classifyComplaint(description, department);
                const slaInfo = getSlaForDepartment(ai.department);
                newComplaint.department = ai.department;
                newComplaint.riskLevel = ai.riskLevel;
                newComplaint.emotion = ai.emotion;
                newComplaint.aiSummary = ai.aiSummary;
                newComplaint.priority = slaInfo.priority;
                newComplaint.slaDeadline = slaInfo.slaDeadline;
                newComplaint.status = 'Validated';
                newComplaint.auditLog.push({
                    action: 'AI Classification Completed',
                    performedBy: 'AI Engine',
                    performedByRole: 'system',
                    note: `Classified as ${ai.department} | Priority: ${slaInfo.priority} | Risk: ${ai.riskLevel}`
                });

                // --- 2. Advanced Fraud & False/True Classification via Python ML ---
                try {
                    const fetch = (await import('node-fetch')).default;
                    const FormData = (await import('form-data')).default;
                    const form = new FormData();

                    form.append('user_id', String(req.user.userId));

                    // Map department to Python ComplaintCategory
                    const catMap = {
                        'Sanitation': 'GARBAGE',
                        'Roads': 'POTHOLE',
                        'Electricity': 'STREETLIGHT',
                        'Water Supply': 'WATER'
                    };
                    const pyCategory = catMap[ai.department] || 'OTHER';
                    form.append('category', pyCategory);
                    form.append('text', description);
                    form.append('gps_lat', String(location?.lat || 0));
                    form.append('gps_long', String(location?.lng || 0));

                    if (photo && photo.startsWith('data:image')) {
                        // Extract base64 part
                        const matches = photo.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                        if (matches && matches.length === 3) {
                            const buffer = Buffer.from(matches[2], 'base64');
                            form.append('image', buffer, { filename: 'upload.jpg', contentType: matches[1] });
                        }
                    }

                    console.log('Sending to Python AI Engine...');
                    const pyRes = await fetch('http://localhost:8000/submit-complaint', {
                        method: 'POST',
                        body: form
                    });

                    if (pyRes.ok) {
                        const pyData = await pyRes.json();
                        console.log('Python AI Fraud Check:', pyData.status, pyData.risk_score);

                        // Update MongoDB with python result
                        if (pyData.status === 'REJECTED') {
                            newComplaint.status = 'Rejected';
                            newComplaint.riskLevel = 'Critical';
                            newComplaint.auditLog.push({
                                action: 'Spam/Fraud Detected',
                                performedBy: 'AI Fraud Engine',
                                performedByRole: 'system',
                                note: `Rejected with Risk Score: ${pyData.risk_score.toFixed(2)}`
                            });
                        } else if (pyData.status === 'SUSPICIOUS') {
                            newComplaint.status = 'Under Review';
                            newComplaint.auditLog.push({
                                action: 'Marked Suspicious',
                                performedBy: 'AI Fraud Engine',
                                performedByRole: 'system',
                                note: `Suspicious activity. Risk Score: ${pyData.risk_score.toFixed(2)}`
                            });
                        } else {
                            // APPROVED
                            newComplaint.auditLog.push({
                                action: 'Fraud Check Passed',
                                performedBy: 'AI Fraud Engine',
                                performedByRole: 'system',
                                note: `Verified as genuine. Risk Score: ${pyData.risk_score.toFixed(2)}`
                            });
                        }
                    } else {
                        console.error('Python AI Engine Error:', pyRes.status, await pyRes.text());
                    }
                } catch (pyErr) {
                    console.error('Error connecting to Python Fraud Engine:', pyErr.message);
                }

                // ── Auto-assign to least-loaded field worker in same dept ──────
                try {
                    const workers = await User.find({ role: 'field_worker', department: ai.department });
                    if (workers.length > 0) {
                        // Count active complaints per worker
                        const workloads = await Promise.all(workers.map(async (w) => {
                            const count = await Complaint.countDocuments({
                                assignedTo: w._id,
                                status: { $in: ['Assigned', 'In Progress'] }
                            });
                            return { worker: w, count };
                        }));
                        workloads.sort((a, b) => a.count - b.count);
                        const bestWorker = workloads[0].worker;
                        newComplaint.assignedTo = bestWorker._id;
                        newComplaint.assignedAt = new Date();
                        newComplaint.status = 'Assigned';
                        newComplaint.auditLog.push({
                            action: 'Auto-Assigned to Field Worker',
                            performedBy: 'System',
                            performedByRole: 'system',
                            note: `Auto-assigned to ${bestWorker.name} (${bestWorker.email}) — least workload (${workloads[0].count} active tasks)`
                        });
                    }
                } catch (assignErr) {
                    console.error('Auto-assignment error:', assignErr.message);
                }

                await newComplaint.save();
                req.io.emit('new_complaint_processed', newComplaint);
                req.io.emit(`complaint_updated_${req.user.userId}`, newComplaint);
            } catch (e) {
                console.error('AI processing error:', e.message);
            }
        }, 3000);

        res.status(201).json({
            message: isDuplicate
                ? 'Note: A similar complaint was already filed nearby. Your complaint is still registered.'
                : 'Complaint registered successfully',
            complaint: newComplaint,
            isDuplicate
        });
    } catch (error) {
        console.error('Error submitting complaint:', error);
        res.status(500).json({ message: 'Server error while submitting complaint' });
    }
});

// ── Citizen: Get own complaints ───────────────────────────────────────────────
router.get('/my-complaints', authMiddleware, async (req, res) => {
    try {
        const complaints = await Complaint.find({ userId: req.user.userId })
            .sort({ createdAt: -1 })
            .populate('assignedTo', 'name email');
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// ── Admin/Officer/Commissioner: Get all complaints ────────────────────────────
router.get('/all', authMiddleware, async (req, res) => {
    const allowed = ['admin', 'officer', 'commissioner'];
    if (!allowed.includes(req.user.role)) return res.status(403).json({ message: 'Access denied' });
    try {
        const filter = {};
        if (req.user.role === 'officer' && req.user.department) {
            filter.department = req.user.department;
        }
        if (req.query.status) filter.status = req.query.status;
        if (req.query.department) filter.department = req.query.department;
        if (req.query.slaBreached === 'true') filter.slaBreached = true;

        const complaints = await Complaint.find(filter)
            .sort({ createdAt: -1 })
            .limit(100)
            .populate('assignedTo', 'name email');
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// ── Heatmap data ──────────────────────────────────────────────────────────────
router.get('/heatmap', authMiddleware, async (req, res) => {
    const allowed = ['admin', 'officer', 'commissioner'];
    if (!allowed.includes(req.user.role)) return res.status(403).json({ message: 'Access denied' });
    try {
        const points = await Complaint.find(
            { 'location.lat': { $exists: true } },
            'location priority riskLevel status department'
        );
        res.json(points);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// ── Field Worker: Get assigned complaints ─────────────────────────────────────
router.get('/assigned', authMiddleware, async (req, res) => {
    if (req.user.role !== 'field_worker') return res.status(403).json({ message: 'Field worker access only' });
    try {
        const complaints = await Complaint.find({ assignedTo: req.user.userId })
            .sort({ priority: 1, createdAt: 1 });
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// ── Officer: Assign complaint to field worker ─────────────────────────────────
router.put('/:id/assign', authMiddleware, async (req, res) => {
    if (!['officer', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Officer/Admin access only' });
    }
    try {
        const { workerId } = req.body;
        const worker = await User.findById(workerId);
        if (!worker || worker.role !== 'field_worker') {
            return res.status(400).json({ message: 'Invalid field worker' });
        }

        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

        complaint.assignedTo = workerId;
        complaint.assignedAt = new Date();
        complaint.status = 'Assigned';
        complaint.auditLog.push({
            action: 'Assigned to Field Worker',
            performedBy: req.user.name || 'Officer',
            performedByRole: req.user.role,
            note: `Assigned to ${worker.name} (${worker.email})`
        });
        await complaint.save();

        req.io.emit('new_complaint_processed', complaint);
        res.json({ message: 'Complaint assigned', complaint });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// ── Field Worker: Resolve complaint with GPS proof ────────────────────────────
router.put('/:id/resolve', authMiddleware, async (req, res) => {
    if (req.user.role !== 'field_worker') {
        return res.status(403).json({ message: 'Field worker access only' });
    }
    try {
        const { afterPhoto, currentLat, currentLng } = req.body;
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
        if (String(complaint.assignedTo) !== String(req.user.userId)) {
            return res.status(403).json({ message: 'Not assigned to you' });
        }

        // GPS verification
        let gpsVerified = false;
        let gpsNote = 'GPS not provided';
        if (currentLat && currentLng && complaint.location?.lat && complaint.location?.lng) {
            const dist = getDistanceMetres(
                complaint.location.lat, complaint.location.lng,
                parseFloat(currentLat), parseFloat(currentLng)
            );
            gpsVerified = dist <= 500; // 500m geo-fence
            gpsNote = `GPS distance from complaint: ${Math.round(dist)}m. ${gpsVerified ? 'Within geo-fence ✓' : 'Outside geo-fence ✗'}`;
        }

        complaint.afterPhoto = afterPhoto || null;
        complaint.gpsVerified = gpsVerified;
        complaint.resolutionLocation = { lat: currentLat, lng: currentLng };
        complaint.status = 'Resolved';
        complaint.citizenFeedback = 'pending';
        complaint.auditLog.push({
            action: 'Marked as Resolved by Field Worker',
            performedBy: req.user.name || 'Field Worker',
            performedByRole: 'field_worker',
            note: gpsNote
        });
        await complaint.save();

        req.io.emit(`complaint_updated_${complaint.userId}`, complaint);
        req.io.emit('new_complaint_processed', complaint);

        res.json({
            message: 'Complaint resolved. Awaiting citizen confirmation.',
            gpsVerified,
            complaint
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// ── Citizen: Accept or Reject resolution ─────────────────────────────────────
router.put('/:id/feedback', authMiddleware, async (req, res) => {
    if (req.user.role !== 'citizen') return res.status(403).json({ message: 'Citizen access only' });
    try {
        const { feedback, note } = req.body; // 'accepted' | 'rejected'
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
        if (String(complaint.userId) !== String(req.user.userId)) {
            return res.status(403).json({ message: 'Not your complaint' });
        }
        if (complaint.status !== 'Resolved') {
            return res.status(400).json({ message: 'Complaint is not in Resolved state' });
        }

        complaint.citizenFeedback = feedback;
        complaint.feedbackNote = note || '';
        if (feedback === 'accepted') {
            complaint.status = 'Closed';
            complaint.auditLog.push({
                action: 'Resolution Accepted by Citizen',
                performedBy: complaint.name,
                performedByRole: 'citizen',
                note: note || 'Citizen accepted the resolution'
            });
        } else {
            complaint.status = 'In Progress';
            complaint.citizenFeedback = 'rejected';
            complaint.auditLog.push({
                action: 'Resolution Rejected by Citizen',
                performedBy: complaint.name,
                performedByRole: 'citizen',
                note: note || 'Citizen rejected the resolution – ticket reopened'
            });
        }
        await complaint.save();

        req.io.emit(`complaint_updated_${req.user.userId}`, complaint);
        req.io.emit('new_complaint_processed', complaint);
        res.json({ message: feedback === 'accepted' ? 'Complaint closed.' : 'Complaint reopened.', complaint });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// ── Citizen: Dashboard stats ───────────────────────────────────────────────────
router.get('/citizen-stats', authMiddleware, async (req, res) => {
    if (req.user.role !== 'citizen') return res.status(403).json({ message: 'Citizen access only' });
    try {
        const complaints = await Complaint.find({ userId: req.user.userId });
        const total = complaints.length;
        const inProgress = complaints.filter(c => ['Submitted', 'Under Review', 'Assigned', 'In Progress'].includes(c.status)).length;
        const resolved = complaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length;
        const escalated = complaints.filter(c => c.escalationLevel > 0 || c.slaBreached).length;

        // Average resolution time (hours) for resolved complaints
        const resolvedComplaints = complaints.filter(c => ['Resolved', 'Closed'].includes(c.status));
        let avgResolutionHours = 0;
        if (resolvedComplaints.length > 0) {
            const totalMs = resolvedComplaints.reduce((sum, c) => {
                const created = new Date(c.createdAt).getTime();
                const updated = new Date(c.updatedAt).getTime();
                return sum + (updated - created);
            }, 0);
            avgResolutionHours = Math.round(totalMs / resolvedComplaints.length / 3600000);
        }

        // Top category
        const categoryCounts = {};
        complaints.forEach(c => {
            if (c.department && c.department !== 'Pending Analysis') {
                categoryCounts[c.department] = (categoryCounts[c.department] || 0) + 1;
            }
        });
        const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        // Monthly trend (last 6 months)
        const now = new Date();
        const monthlyTrend = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
            const count = complaints.filter(c => {
                const cd = new Date(c.createdAt);
                return cd.getFullYear() === d.getFullYear() && cd.getMonth() === d.getMonth();
            }).length;
            monthlyTrend.push({ month: label, count });
        }

        res.json({ total, inProgress, resolved, escalated, avgResolutionHours, topCategory, monthlyTrend, categoryCounts });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// ── Citizen / All: Nearby complaints map pins ──────────────────────────────────
router.get('/nearby', authMiddleware, async (req, res) => {
    try {
        const { lat, lng, radius = 5 } = req.query; // radius in km
        let query = { 'location.lat': { $exists: true }, 'location.lng': { $exists: true } };

        // If citizen, only show their own + nearby public ones
        if (req.user.role === 'citizen') {
            // Return all with location for map view
        }

        const complaints = await Complaint.find(query,
            'complaintId department status priority location riskLevel description isDuplicate createdAt assignedTo'
        ).limit(200).populate('assignedTo', 'name');

        res.json(complaints);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// ── Field Worker: Mark work as started ───────────────────────────────────────
router.put('/:id/start', authMiddleware, async (req, res) => {
    if (req.user.role !== 'field_worker') {
        return res.status(403).json({ message: 'Field worker access only' });
    }
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
        if (String(complaint.assignedTo) !== String(req.user.userId)) {
            return res.status(403).json({ message: 'Not assigned to you' });
        }
        if (complaint.status !== 'Assigned') {
            return res.status(400).json({ message: 'Complaint is not in Assigned state' });
        }
        complaint.status = 'In Progress';
        complaint.auditLog.push({
            action: 'Work Started by Field Worker',
            performedBy: req.user.name || 'Field Worker',
            performedByRole: 'field_worker',
            note: 'Field worker has commenced work on this complaint'
        });
        await complaint.save();
        req.io.emit('new_complaint_processed', complaint);
        req.io.emit(`complaint_updated_${complaint.userId}`, complaint);
        res.json({ message: 'Work marked as started', complaint });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// ── Officer: Verify/Approve or Reject a resolved complaint ────────────────────
router.put('/:id/verify', authMiddleware, async (req, res) => {
    if (!['officer', 'admin', 'commissioner'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Officer/Admin access only' });
    }
    try {
        const { action, note } = req.body; // action: 'approved' | 'rejected'
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
        if (complaint.status !== 'Resolved') {
            return res.status(400).json({ message: 'Complaint is not in Resolved state' });
        }
        if (action === 'approved') {
            complaint.status = 'Closed';
            complaint.citizenFeedback = 'accepted';
            complaint.auditLog.push({
                action: 'Resolution Approved by Officer',
                performedBy: req.user.name || 'Officer',
                performedByRole: req.user.role,
                note: note || 'Resolution verified and approved by ward officer'
            });
        } else {
            complaint.status = 'In Progress';
            complaint.citizenFeedback = 'rejected';
            complaint.afterPhoto = null;
            complaint.auditLog.push({
                action: 'Resolution Rejected by Officer',
                performedBy: req.user.name || 'Officer',
                performedByRole: req.user.role,
                note: note || 'Resolution rejected – field worker to re-attend'
            });
        }
        await complaint.save();
        req.io.emit('new_complaint_processed', complaint);
        req.io.emit(`complaint_updated_${complaint.userId}`, complaint);
        res.json({ message: action === 'approved' ? 'Resolution approved. Complaint closed.' : 'Resolution rejected. Ticket reopened.', complaint });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// ── Department Stats (for Commissioner) ──────────────────────────────────────
router.get('/stats/departments', authMiddleware, async (req, res) => {
    const allowed = ['admin', 'officer', 'commissioner'];
    if (!allowed.includes(req.user.role)) return res.status(403).json({ message: 'Access denied' });
    try {
        const pipeline = [
            {
                $group: {
                    _id: '$department',
                    total: { $sum: 1 },
                    resolved: {
                        $sum: { $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0] }
                    },
                    slaBreaches: { $sum: { $cond: ['$slaBreached', 1, 0] } },
                    critical: { $sum: { $cond: [{ $eq: ['$priority', 'P0'] }, 1, 0] } },
                    open: {
                        $sum: { $cond: [{ $in: ['$status', ['Submitted', 'Validated', 'Assigned', 'In Progress', 'Under Review']] }, 1, 0] }
                    }
                }
            },
            {
                $addFields: {
                    resolutionRate: {
                        $cond: [
                            { $gt: ['$total', 0] },
                            { $multiply: [{ $divide: ['$resolved', '$total'] }, 100] },
                            0
                        ]
                    }
                }
            },
            { $sort: { resolutionRate: -1 } }
        ];
        const stats = await Complaint.aggregate(pipeline);
        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// ── Ward Stats (ward-wise SLA performance) ────────────────────────────────────
router.get('/stats/wards', authMiddleware, async (req, res) => {
    const allowed = ['admin', 'officer', 'commissioner'];
    if (!allowed.includes(req.user.role)) return res.status(403).json({ message: 'Access denied' });
    try {
        const pipeline = [
            { $match: { ward: { $ne: '', $exists: true } } },
            {
                $group: {
                    _id: '$ward',
                    total: { $sum: 1 },
                    resolved: { $sum: { $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0] } },
                    slaBreaches: { $sum: { $cond: ['$slaBreached', 1, 0] } },
                    open: { $sum: { $cond: [{ $in: ['$status', ['Submitted', 'Validated', 'Assigned', 'In Progress', 'Under Review']] }, 1, 0] } }
                }
            },
            {
                $addFields: {
                    resolutionRate: {
                        $cond: [{ $gt: ['$total', 0] }, { $multiply: [{ $divide: ['$resolved', '$total'] }, 100] }, 0]
                    }
                }
            },
            { $sort: { slaBreaches: -1 } }
        ];
        const stats = await Complaint.aggregate(pipeline);
        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// ── Admin: Get department mapping config ──────────────────────────────────────
router.get('/dept-mapping', authMiddleware, async (req, res) => {
    try {
        let mappings = await DeptMapping.find({}).sort({ complaintType: 1 });
        // If no mappings in DB, return defaults
        if (mappings.length === 0) {
            const defaults = [
                { complaintType: 'Garbage / Waste', department: 'Sanitation', slaMins: 1440, priority: 'P2', keywords: ['garbage', 'waste', 'trash', 'litter', 'sweeping', 'sanitation'] },
                { complaintType: 'Streetlight / Electricity', department: 'Electricity', slaMins: 2880, priority: 'P1', keywords: ['streetlight', 'street light', 'electricity', 'power', 'bulb', 'lamp', 'wire'] },
                { complaintType: 'Pothole / Road Damage', department: 'Roads', slaMins: 7200, priority: 'P1', keywords: ['pothole', 'road', 'footpath', 'bridge', 'traffic signal'] },
                { complaintType: 'Water Leakage / Supply', department: 'Water Supply', slaMins: 4320, priority: 'P1', keywords: ['water', 'pipe', 'leak', 'supply', 'drain', 'sewage', 'tap'] },
                { complaintType: 'Tree Fall / Public Works', department: 'Public Works', slaMins: 2880, priority: 'P2', keywords: ['tree', 'park', 'public', 'building', 'municipal'] },
                { complaintType: 'Billing Issue', department: 'Billing', slaMins: 4320, priority: 'P3', keywords: ['bill', 'charge', 'refund', 'payment', 'invoice'] },
                { complaintType: 'Technical Support', department: 'Tech Support', slaMins: 1440, priority: 'P2', keywords: ['app', 'website', 'portal', 'login', 'technical'] },
            ];
            return res.json(defaults);
        }
        res.json(mappings);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// ── Admin: Update department mapping config ───────────────────────────────────
router.put('/dept-mapping', authMiddleware, async (req, res) => {
    if (!['admin', 'commissioner'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Admin access only' });
    }
    try {
        const { mappings } = req.body; // array of mapping objects
        if (!Array.isArray(mappings)) return res.status(400).json({ message: 'mappings must be an array' });
        // Upsert each mapping
        for (const m of mappings) {
            await DeptMapping.findOneAndUpdate(
                { complaintType: m.complaintType },
                { $set: { department: m.department, slaMins: m.slaMins, priority: m.priority, keywords: m.keywords || [] } },
                { upsert: true, new: true }
            );
        }
        res.json({ message: `${mappings.length} mapping(s) saved successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;

