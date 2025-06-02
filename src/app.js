// src/app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import notificationRoutes from './routes/notifications.js';
import emailRoutes from './routes/emails.js';
import journeyRoutes from './routes/journeys.js'

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} [${req.method}] ${req.url}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'onesignal-backend',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Routes
app.use('/api/notifications', notificationRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/journeys', journeyRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 OneSignal Backend running on port ${PORT}`);
    console.log(`📱 Push endpoints: http://localhost:${PORT}/api/notifications`);
    console.log(`📧 Email endpoints: http://localhost:${PORT}/api/emails`);
    console.log(`🔄 Journey endpoints: http://localhost:${PORT}/api/journeys`);
    console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});

export default app;