import express from 'express';
import { Ward } from '../models/Ward.js';

const router = express.Router();

// ─── Point-in-Polygon (Ray-Casting Algorithm) ─────────────────────────────────
function pointInPolygon(lat, lng, polygon) {
    // polygon is array of [lat, lng] pairs
    let inside = false;
    const x = lat, y = lng;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];
        const intersect = ((yi > y) !== (yj > y)) &&
            (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// Find nearest ward centroid if point falls outside all polygons (boundary edge case)
function nearestWard(lat, lng, wards) {
    let nearest = null;
    let minDist = Infinity;
    for (const ward of wards) {
        // compute centroid
        const n = ward.polygon.length;
        const cLat = ward.polygon.reduce((s, p) => s + p[0], 0) / n;
        const cLng = ward.polygon.reduce((s, p) => s + p[1], 0) / n;
        const dist = Math.sqrt((lat - cLat) ** 2 + (lng - cLng) ** 2);
        if (dist < minDist) { minDist = dist; nearest = ward; }
    }
    return nearest;
}

// ─── Seed Default Wards (35 wards for a demo Indian city – Pune-inspired) ─────
export async function seedWards() {
    const count = await Ward.countDocuments();
    if (count > 0) return; // already seeded

    // Generate a 7×5 grid of rectangular wards around a central point (Pune-ish: 18.52°N, 73.85°E)
    const baseLat = 18.48, baseLng = 73.82;
    const cellLat = 0.025, cellLng = 0.03;
    const rows = 5, cols = 7;

    const wardNames = [
        'Kasba', 'Vishrambaug', 'Shivajinagar', 'Kothrud', 'Karve Nagar', 'Erandwane', 'Deccan',
        'Swargate', 'Sahakarnagar', 'Bibwewadi', 'Parvati', 'Katraj', 'Hadapsar', 'Wanowrie',
        'Ghorpadi', 'Lashkar', 'Kirkee', 'Dapodi', 'Aundh', 'Baner', 'Pashan', 'Bavdhan',
        'Wakad', 'Pimpri', 'Chinchwad', 'Bhosari', 'Dighi', 'Vadgaon Sheri', 'Nagar Road',
        'Kharadi', 'Wagholi', 'Ambegaon', 'Dhayari', 'Kondhwa', 'Undri'
    ];

    const wardsToInsert = [];
    let wardNo = 1;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (wardNo > 35) break;
            const lat0 = baseLat + r * cellLat;
            const lng0 = baseLng + c * cellLng;
            const polygon = [
                [lat0, lng0],
                [lat0 + cellLat, lng0],
                [lat0 + cellLat, lng0 + cellLng],
                [lat0, lng0 + cellLng],
                [lat0, lng0] // close ring
            ];
            wardsToInsert.push({
                wardNo,
                wardName: `Ward ${wardNo} – ${wardNames[wardNo - 1] || 'Area'}`,
                city: 'Demo City (Pune)',
                polygon
            });
            wardNo++;
        }
    }

    await Ward.insertMany(wardsToInsert);
    console.log(`✅ Seeded ${wardsToInsert.length} wards`);
}

// ─── POST /api/wards/detect ───────────────────────────────────────────────────
// Takes { lat, lng }, returns matching ward
router.post('/detect', async (req, res) => {
    try {
        const { lat, lng } = req.body;
        if (!lat || !lng) return res.status(400).json({ message: 'lat and lng required' });

        const wards = await Ward.find({});
        if (wards.length === 0) return res.json({ wardName: 'Ward Detection Unavailable', wardNo: null });

        // Primary: point-in-polygon
        let detected = wards.find(w => pointInPolygon(parseFloat(lat), parseFloat(lng), w.polygon));

        // Fallback: nearest centroid (handles boundary/edge cases)
        if (!detected) {
            detected = nearestWard(parseFloat(lat), parseFloat(lng), wards);
        }

        res.json({
            wardNo: detected.wardNo,
            wardName: detected.wardName,
            city: detected.city,
            confidence: detected ? 'exact' : 'nearest'
        });
    } catch (err) {
        console.error('Ward detect error:', err);
        res.status(500).json({ message: 'Ward detection failed' });
    }
});

// ─── GET /api/wards ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const wards = await Ward.find({}, 'wardNo wardName city').sort({ wardNo: 1 });
        res.json(wards);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
