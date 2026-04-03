import mongoose from 'mongoose';

const deptMappingSchema = new mongoose.Schema({
    complaintType: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    slaMins: { type: Number, default: 1440 },  // default 24h
    priority: { type: String, enum: ['P0', 'P1', 'P2', 'P3'], default: 'P2' },
    keywords: { type: [String], default: [] }  // keywords that trigger this type
}, { timestamps: true });

export const DeptMapping = mongoose.model('DeptMapping', deptMappingSchema);
