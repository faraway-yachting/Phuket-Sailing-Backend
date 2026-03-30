import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';

import cookieParser from 'cookie-parser';
import ApiErrorMiddleware from './middleware/ApiError.middleware.js';
import { helmetMiddleware } from './middleware/helmet.middleware.js';
import router from './router/index.js';
import { requestTimer } from './utils/cache.js';

const app = express();

const startServer = async () => {
    try {
        // Basic middleware
        app.use(express.json({ limit: '10mb' }));
        app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        app.use(cookieParser());

        // Security headers with helmet
        app.use(helmetMiddleware);

        // Disable ETag and prevent response caching for dynamic API routes
        app.disable('etag');
        app.use((req, res, next) => {
            res.set('Cache-Control', 'no-store');
            next();
        });

        // CORS
        app.use(cors({
            origin: [
                'http://localhost:3000',
                'https://phuket-sailing.vercel.app',
                'https://phuket-sailing-admin.vercel.app'
            ],
            credentials: true
        }));

        // Static files
        app.use('/uploads', express.static(path.join(process.cwd(), 'src', 'uploads')));

        // Request timing
        app.use(requestTimer);

        // Health check
        app.get('/health', (req, res) => {
            const dbState = mongoose.connection.readyState;
            const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown';
            const isHealthy = dbState === 1;
            res.status(isHealthy ? 200 : 503).json({
                status: isHealthy ? 'OK' : 'DEGRADED',
                db: dbStatus,
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });

        // Return 503 when DB is not ready instead of hanging
        app.use((req, res, next) => {
            if (mongoose.connection.readyState !== 1) {
                return res.status(503).json({ message: 'Service temporarily unavailable. Please try again shortly.' });
            }
            next();
        });

        // Routes
        app.use('/', router);
        app.use(ApiErrorMiddleware);

    } catch (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    }
};

startServer();
export default app;
