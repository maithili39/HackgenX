import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { Server } from 'socket.io';
import { createServer } from 'http';
import dotenv from 'dotenv';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import complaintRoutes from './routes/complaints.js';
import wardRoutes, { seedWards } from './routes/wardRoutes.js';
import aiRoutes from './routes/ai.js';
import { initializeSlaWorker, startSlaJob } from './queue/slaQueue.js';
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import compression from 'compression';
import pinoHttp from 'pino-http';

dotenv.config();

// Initialize Sentry early
Sentry.init({
  dsn: process.env.SENTRY_DSN || "",
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { 
        origin: process.env.FRONTEND_URL || 'http://localhost:5173', 
        methods: ["GET", "POST", "PUT"],
        credentials: true
    }
});

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(helmet());
app.use(cookieParser());
app.use(mongoSanitize());
app.use(express.json({ limit: '10mb' }));
app.use(compression()); // Gzip compression

// Structured logging for requests
app.use(pinoHttp({
    customLogLevel: (req, res, err) => {
        if (res.statusCode >= 400 && res.statusCode < 500) return 'warn';
        if (res.statusCode >= 500 || err) return 'error';
        if (res.statusCode >= 300 && res.statusCode < 400) return 'silent'; // Optional: skip redirects
        return 'info';
    },
    autoLogging: {
        ignore: req => req.url === '/api/health' // Ignore health checks to prevent log spam
    }
}));

// Pass io to routes so they can emit events
app.use((req, res, next) => {
    req.io = io;
    next();
});

import userRoutes from './routes/users.js';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/wards', wardRoutes);
app.use('/api/ai', aiRoutes);  // AI features: chatbot + summarizer
app.use('/api/users', userRoutes);

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
    try {
        const dbState = mongoose.connection.readyState;
        const dbStatus = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
        
        res.json({
            status: 'ok',
            uptime: process.uptime(),
            database: dbStatus[dbState] || 'unknown',
            timestamp: new Date()
        });
    } catch (e) {
        res.status(500).json({ status: 'error', error: e.message });
    }
});

// MongoDB Connect
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civicsense', { maxPoolSize: 10 })
    .then(async () => {
        console.log('Connected to MongoDB');
        await seedWards();
        initializeSlaWorker(io);
        await startSlaJob();
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

io.on('connection', (socket) => {
    console.log('Client connected for real-time updates');
    socket.on('disconnect', () => console.log('Client disconnected'));
});

// Sentry Error Handler (must be before any other error middleware)
Sentry.setupExpressErrorHandler(app);

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
