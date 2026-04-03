import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['citizen', 'admin', 'field_worker', 'officer', 'commissioner'], default: 'citizen' },

    // Profile fields
    phone: { type: String, default: '' },
    ward: { type: String, default: '' },
    address: { type: String, default: '' },
    profilePicture: { type: String, default: '' },
    department: { type: String, default: null },

    // Verification & Scoring
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    citizenScore: { type: Number, default: 50 },

    // Notification prefs
    notifyEmail: { type: Boolean, default: true },
    notifySMS: { type: Boolean, default: false }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);
