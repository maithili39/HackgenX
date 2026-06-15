import express from 'express';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { User } from '../models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'hackathon_secret_key_123';

// ─── In-Memory OTP Store (email -> { otp, expiry }) ─────────────────────────
const otpStore = new Map();

// ─── Send OTP via Nodemailer (Ethereal test account) ─────────────────────────
router.post('/send-otp', async (req, res) => {
    try {
        const { email, name, role } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        if (!process.env.RESEND_API_KEY) {
            console.error('Missing RESEND_API_KEY in backend/api/.env');
            return res.status(500).json({ message: 'Email API is not configured on the server.' });
        }

        const roleLabel = (role || 'user').replace('_', ' ').toUpperCase();

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore.set(email, { otp, expiry: Date.now() + 5 * 60 * 1000 }); // 5 min expiry

        const htmlContent = `
<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;
           background:#0f172a;color:#e2e8f0;border-radius:12px;border:1px solid #1e293b;">
  <h2 style="color:#3b82f6;margin-bottom:4px;">CivicSense Portal</h2>
  <p style="color:#64748b;font-size:0.8rem;margin-top:0;">AI-Powered Grievance Redressal System</p>
  <hr style="border-color:#1e293b;margin:16px 0;" />

  <p>Hello <strong>${name || 'User'}</strong>,</p>
  <p>You are registering as a <strong>${roleLabel}</strong> on the CivicSense portal.
     Please verify your email with the OTP below:</p>

  <div style="text-align:center;margin:28px 0;">
    <span style="font-size:2.8rem;font-weight:bold;letter-spacing:0.35em;
                 color:#3b82f6;background:#1e293b;padding:18px 36px;
                 border-radius:10px;display:inline-block;
                 border:2px solid #3b82f6;">${otp}</span>
  </div>

  <p style="color:#94a3b8;font-size:0.85rem;">
    This OTP is valid for 5 minutes. Do not share it with anyone.
  </p>
  <hr style="border-color:#1e293b;margin:20px 0;" />
  <p style="color:#475569;font-size:0.75rem;">
    If you did not initiate this registration, please ignore this email.
  </p>
</div>`;

        const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'CivicSense <onboarding@resend.dev>',
                to: email,
                subject: '[CivicSense] Email Verification OTP',
                html: htmlContent
            })
        });

        const resendData = await resendRes.json();

        if (!resendRes.ok) {
            throw new Error(resendData.message || 'Failed to send via Resend API');
        }

        console.log('\n📧  RESEND API: OTP EMAIL DISPATCHED');
        console.log(`    To      : ${email}  (Role: ${roleLabel})`);
        console.log(`    Msg ID  : ${resendData.id}\n`);

        res.json({ message: 'OTP sent successfully to your email' });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ message: 'Failed to send OTP email', error: error.message });
    }
});

// ─── Auth Middleware ──────────────────────────────────────────────────────────
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token invalid' });
    }
};

// Register Citizen, Field Worker, Officer, Commissioner, or Admin
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, department, phone, otp } = req.body;

        if (!name || !email || !password || !otp) {
            return res.status(400).json({ message: 'Please provide all required fields including OTP' });
        }

        // Verify OTP
        const stored = otpStore.get(email);
        if (!stored) return res.status(400).json({ message: 'No OTP requested or OTP expired' });
        if (Date.now() > stored.expiry) {
            otpStore.delete(email);
            return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
        }
        if (stored.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
        
        // OTP verified successfully, clear it
        otpStore.delete(email);

        const allowedRoles = ['citizen', 'admin', 'field_worker', 'officer', 'commissioner'];
        const userRole = allowedRoles.includes(role) ? role : 'citizen';

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const user = new User({
            name,
            email,
            password,
            role: userRole,
            department: department || null,
            phone: phone || null,
            emailVerified: true   // OTP was verified on registration
        });
        await user.save();

        const token = jwt.sign(
            { userId: user._id, role: user.role, department: user.department, name: user.name },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.status(201).json({
            token,
            user: { id: user._id, name: user.name, role: user.role, department: user.department }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { userId: user._id, role: user.role, department: user.department, name: user.name },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.json({
            token,
            user: { id: user._id, name: user.name, role: user.role, department: user.department }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all field workers in a department (for officer to assign)
router.get('/field-workers', async (req, res) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!['officer', 'admin', 'commissioner'].includes(decoded.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        const dept = req.query.department || decoded.department;
        const workers = await User.find({ role: 'field_worker', department: dept }, 'name email department');
        res.json(workers);
    } catch (err) {
        res.status(401).json({ message: 'Token invalid' });
    }
});

// ── GET /api/auth/me — Full profile for logged-in user ────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ── PUT /api/auth/profile — Update citizen profile ────────────────────────────
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { name, phone, ward, address, profilePicture, notifyEmail, notifySMS } = req.body;
        const updates = {};
        if (name) updates.name = name;
        if (phone !== undefined) updates.phone = phone;
        if (ward !== undefined) updates.ward = ward;
        if (address !== undefined) updates.address = address;
        if (profilePicture !== undefined) updates.profilePicture = profilePicture;
        if (notifyEmail !== undefined) updates.notifyEmail = notifyEmail;
        if (notifySMS !== undefined) updates.notifySMS = notifySMS;

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { $set: updates },
            { new: true, select: '-password' }
        );
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Recalculate citizen score based on profile completeness
        let score = 30; // base
        if (user.phone) score += 15;
        if (user.ward) score += 15;
        if (user.address) score += 10;
        if (user.profilePicture) score += 10;
        if (user.emailVerified) score += 20;
        await User.findByIdAndUpdate(req.user.userId, { citizenScore: Math.min(score, 100) });

        res.json({ message: 'Profile updated', user: { ...user.toObject(), citizenScore: score } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;

