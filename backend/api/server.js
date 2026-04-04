import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { Server } from 'socket.io';
import { createServer } from 'http';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import complaintRoutes from './routes/complaints.js';
import wardRoutes, { seedWards } from './routes/wardRoutes.js';
import aiRoutes from './routes/ai.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST", "PUT"] }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Log all requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Pass io to routes so they can emit events
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/wards', wardRoutes);
app.use('/api/ai', aiRoutes);  // AI features: chatbot + summarizer

// MongoDB Connect
mongoose.connect(process.env.MONGO_URI || )
    .then(async () => {
        console.log('Connected to MongoDB');
        // Seed wards on startup if collection is empty
        await seedWards();
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

io.on('connection', (socket) => {
    console.log('Client connected for real-time updates');
    socket.on('disconnect', () => console.log('Client disconnected'));
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`AI Complaint Engine Backend running on port ${PORT}`);
});

httpServer.on('error', async (error) => {
    if (error.code === 'EADDRINUSE') {
        console.warn(`\n⚠️  Port ${PORT} busy — killing occupying process and retrying...\n`);
        try {
            // Dynamically import kill-port (ESM compatible)
            const { default: killPort } = await import('kill-port');
            await killPort(PORT);
            setTimeout(() => {
                httpServer.close();
                httpServer.listen(PORT, () => {
                    console.log(`✅ AI Complaint Engine Backend running on port ${PORT}`);
                });
            }, 1000);
        } catch (e) {
            console.error(`Could not free port ${PORT}:`, e.message);
            process.exit(1);
        }
    } else {
        console.error('Server error:', error);
        throw error;
    }
});
