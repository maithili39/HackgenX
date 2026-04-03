import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    action: { type: String, required: true },
    performedBy: { type: String, required: true }, // user name or system
    performedByRole: { type: String, default: 'system' },
    note: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now }
}, { _id: false });

const complaintSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    complaintId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    contact: { type: String, required: true }, // Email or Phone
    homeAddress: { type: String, required: true },

    // Complaint Details
    department: { type: String, default: 'Pending Analysis' },
    description: { type: String, required: true },
    photo: { type: String }, // URL or base64 string
    location: {
        lat: { type: Number },
        lng: { type: Number },
        address: { type: String }
    },

    // AI Generated fields
    riskLevel: { type: String, enum: ['Low', 'Medium', 'High', 'Critical', 'Calculating...'], default: 'Calculating...' },
    emotion: { type: String, default: 'Analyzing...' },
    aiSummary: { type: String, default: '' },

    // Priority & SLA
    priority: { type: String, enum: ['P0', 'P1', 'P2', 'P3', 'Pending'], default: 'Pending' },
    slaDeadline: { type: Date, default: null }, // Auto-set based on priority
    escalationLevel: { type: Number, default: 0 }, // 0=normal, 1=officer, 2=commissioner, 3=critical
    slaBreached: { type: Boolean, default: false },

    // Assignment
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    assignedAt: { type: Date, default: null },

    // Resolution proof
    beforePhoto: { type: String, default: null },
    afterPhoto: { type: String, default: null },
    gpsVerified: { type: Boolean, default: false },
    resolutionLocation: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null }
    },

    // Citizen feedback
    citizenFeedback: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    feedbackNote: { type: String, default: '' },

    // Duplicate tracking
    isDuplicate: { type: Boolean, default: false },
    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', default: null },

    // Ward (auto-detected from GPS)
    ward: { type: String, default: '' },

    // Status
    status: {
        type: String,
        enum: ['Submitted', 'Validated', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Rejected', 'Under Review'],
        default: 'Submitted'
    },

    // Immutable Audit Log
    auditLog: { type: [auditLogSchema], default: [] }

}, { timestamps: true });

export const Complaint = mongoose.model('Complaint', complaintSchema);
