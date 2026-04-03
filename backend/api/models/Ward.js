import mongoose from 'mongoose';

const wardSchema = new mongoose.Schema({
    wardNo: { type: Number, required: true, unique: true },
    wardName: { type: String, required: true },
    city: { type: String, default: 'Demo City' },
    // polygon as array of [lng, lat] pairs (GeoJSON-like ring)
    polygon: { type: [[Number]], required: true }
}, { timestamps: false });

export const Ward = mongoose.model('Ward', wardSchema);
