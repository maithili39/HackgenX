import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { OTP } from '../models/OTP.js';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'hackathon_secret_key_123';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'hackathon_refresh_key_123';

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

const setCookies = (res, accessToken, refreshToken) => {
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        maxAge: 15 * 60 * 1000 // 15 mins
    });
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
};

const sendEmail = async (email, subject, htmlContent) => {
    if (!process.env.RESEND_API_KEY) {
        console.error('Missing RESEND_API_KEY in backend/api/.env, skipping email to:', email);
        return;
    }
    const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'CivicSense <onboarding@resend.dev>',
            to: email,
            subject: subject,
            html: htmlContent
        })
    });
    const resendData = await resendRes.json();
    if (!resendRes.ok) {
        throw new Error(resendData.message || 'Failed to send via Resend API');
    }
    console.log(`\n📧  EMAIL DISPATCHED: ${subject} to ${email}`);
};

router.post('/send-otp', authLimiter, async (req, res) => {
    try {
        const { email, name, role } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const roleLabel = (role || 'user').replace('_', ' ').toUpperCase();
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);
        
        await OTP.deleteMany({ email });
        await OTP.create({ email, otp: hashedOtp });

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
  <p style="color:#94a3b8;font-size:0.85rem;">This OTP is valid for 5 minutes. Do not share it with anyone.</p>
</div>`;
        
        try {
            await sendEmail(email, '[CivicSense] Email Verification OTP', htmlContent);
        } catch (e) {
            console.error('Email send failed:', e.message);
            // If email fails, don't fail the API call in dev, just print OTP for hackathon
            console.log(`\n⚠️  DEV MODE OTP FOR ${email}: ${otp}\n`);
        }

        res.json({ message: 'OTP sent successfully to your email' });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ message: 'Failed to send OTP email', error: error.message });
    }
});

const authMiddleware = (req, res, next) => {
    let token = req.cookies?.accessToken;
    if (!token && req.header('Authorization')) {
        token = req.header('Authorization').replace('Bearer ', '');
    }
    if (!token) return res.status(401).json({ message: 'No token' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token invalid' });
    }
};

router.post('/register', authLimiter, async (req, res) => {
    try {
        const { name, email, password, role, department, phone, otp } = req.body;
        if (!name || !email || !password || !otp) {
            return res.status(400).json({ message: 'Please provide all required fields including OTP' });
        }

        const otpRecord = await OTP.findOne({ email });
        if (!otpRecord) return res.status(400).json({ message: 'No OTP requested or OTP expired' });
        
        const isMatch = await bcrypt.compare(otp, otpRecord.otp);
        if (!isMatch) return res.status(400).json({ message: 'Invalid OTP' });
        
        await OTP.deleteMany({ email });

        const allowedRoles = ['citizen', 'admin', 'field_worker', 'officer', 'commissioner'];
        const userRole = allowedRoles.includes(role) ? role : 'citizen';

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const user = new User({
            name, email, password, role: userRole, department: department || null, phone: phone || null, emailVerified: true
        });
        await user.save();

        const accessToken = jwt.sign(
            { userId: user._id, role: user.role, department: user.department, name: user.name },
            JWT_SECRET, { expiresIn: '15m' }
        );
        const refreshToken = jwt.sign({ userId: user._id }, REFRESH_SECRET, { expiresIn: '7d' });
        setCookies(res, accessToken, refreshToken);

        res.status(201).json({
            user: { id: user._id, name: user.name, role: user.role, department: user.department }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.post('/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Please provide email and password' });

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const accessToken = jwt.sign(
            { userId: user._id, role: user.role, department: user.department, name: user.name },
            JWT_SECRET, { expiresIn: '15m' }
        );
        const refreshToken = jwt.sign({ userId: user._id }, REFRESH_SECRET, { expiresIn: '7d' });
        setCookies(res, accessToken, refreshToken);

        res.json({
            user: { id: user._id, name: user.name, role: user.role, department: user.department }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.post('/refresh', async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: 'No refresh token' });
    try {
        const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(401).json({ message: 'User not found' });
        
        const accessToken = jwt.sign(
            { userId: user._id, role: user.role, department: user.department, name: user.name },
            JWT_SECRET, { expiresIn: '15m' }
        );
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none',
            maxAge: 15 * 60 * 1000
        });
        res.json({ message: 'Token refreshed successfully' });
    } catch (err) {
        res.status(401).json({ message: 'Invalid refresh token' });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
});

router.post('/forgot-password', authLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });

        const resetToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '10m' });
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
        
        const html = `
<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;
           background:#0f172a;color:#e2e8f0;border-radius:12px;border:1px solid #1e293b;">
  <h2 style="color:#3b82f6;margin-bottom:4px;">CivicSense Password Reset</h2>
  <hr style="border-color:#1e293b;margin:16px 0;" />
  <p>You requested a password reset. Click the link below to set a new password:</p>
  <a href="${resetLink}" style="color:#3b82f6;">Reset Password</a>
  <p style="color:#94a3b8;font-size:0.85rem;margin-top:20px;">This link expires in 10 minutes.</p>
</div>`;
        try {
            await sendEmail(email, '[CivicSense] Password Reset', html);
        } catch (e) {
            console.error('Email send failed:', e.message);
            console.log(`\n⚠️  DEV MODE RESET LINK FOR ${email}: ${resetLink}\n`);
        }

        res.json({ message: 'Password reset email sent' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/reset-password', authLimiter, async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) return res.status(400).json({ message: 'Missing fields' });

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(400).json({ message: 'User not found' });

        user.password = newPassword; 
        await user.save();
        res.json({ message: 'Password reset successful' });
    } catch (err) {
        res.status(400).json({ message: 'Invalid or expired token' });
    }
});

router.get('/field-workers', async (req, res) => {
    // Keep header auth for this just in case, or rely on middleware which checks both
    let token = req.cookies?.accessToken;
    if (!token && req.header('Authorization')) {
        token = req.header('Authorization').replace('Bearer ', '');
    }
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

router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

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

        let score = 30;
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
