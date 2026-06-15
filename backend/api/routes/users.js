import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'hackathon_secret_key_123';

// Auth Middleware
const authMiddleware = (req, res, next) => {
    let token = req.cookies?.accessToken;
    if (!token && req.header('Authorization')) {
        token = req.header('Authorization').replace('Bearer ', '');
    }
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// ── Admin: Get all users ──────────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access only' });
    try {
        const users = await User.find({}).select('-password').sort({ role: 1, name: 1 });
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// ── Admin: Create a new user (Officer, Field Worker, Commissioner) ─────────────
router.post('/', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access only' });
    try {
        const { name, email, password, role, department, ward } = req.body;
        
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'Name, email, password, and role are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role,
            department: department || null,
            ward: ward || null,
            isVerified: true // Admin created, auto-verified
        });

        await newUser.save();
        
        // Return user without password
        const userObj = newUser.toObject();
        delete userObj.password;
        
        res.status(201).json({ message: 'User created successfully', user: userObj });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// ── Officer/Admin: Get field workers for a department ─────────────────────────
router.get('/workers', authMiddleware, async (req, res) => {
    if (!['officer', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied' });
    }
    try {
        const filter = { role: 'field_worker' };
        
        // If officer, optionally only show workers from their department
        if (req.user.role === 'officer' && req.user.department) {
            filter.department = req.user.department;
        }

        const workers = await User.find(filter).select('-password');
        res.json(workers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
