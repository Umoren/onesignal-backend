import express from 'express';
import OneSignalService from '../services/onesignal.js';

const router = express.Router();
const oneSignal = new OneSignalService();

// Health check
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'journeys',
        provider: 'onesignal',
        timestamp: new Date().toISOString()
    });
});

// Test OneSignal API connectivity
router.get('/test-connection', async (req, res) => {
    try {
        console.log('🧪 Testing OneSignal API connection...');

        const result = await oneSignal.testConnection();

        if (result.success) {
            res.json({
                message: 'OneSignal API connection successful',
                url: result.url,
                app_name: result.app.name,
                success: true
            });
        } else {
            res.status(500).json({
                error: 'OneSignal API connection failed',
                message: result.error,
                suggestion: result.suggestion,
                success: false
            });
        }

    } catch (error) {
        console.error('Connection test error:', error.message);
        res.status(500).json({
            error: 'Failed to test OneSignal connection',
            message: error.message,
            success: false
        });
    }
});

// Create user for Journey testing
router.post('/create-user', async (req, res) => {
    try {
        const { externalId, email, firstName, companyName } = req.body;

        if (!externalId || !email || !firstName) {
            return res.status(400).json({
                error: 'externalId, email, and firstName are required'
            });
        }

        console.log(`👤 Creating user: ${externalId}`);

        const result = await oneSignal.createUser({
            externalId,
            email,
            firstName,
            companyName: companyName || 'Test Company'
        });

        res.json({
            message: 'User created successfully',
            externalId,
            email,
            user: result,
            success: true
        });

    } catch (error) {
        console.error('Create user error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to create user',
            message: error.response?.data?.errors?.[0] || error.message
        });
    }
});

// Trigger Journey by adding user to segment
router.post('/trigger-journey', async (req, res) => {
    try {
        const { externalId, segmentTag = "new_users", segmentValue = "true" } = req.body;

        if (!externalId) {
            return res.status(400).json({
                error: 'externalId is required'
            });
        }

        console.log(`🚀 Triggering Journey for user: ${externalId}`);

        const result = await oneSignal.addUserToSegment(externalId, segmentTag, segmentValue);

        res.json({
            message: 'Journey triggered - user added to segment',
            externalId,
            segmentTag,
            segmentValue,
            note: 'Journey will execute automatically based on your OneSignal Journey setup',
            success: true
        });

    } catch (error) {
        console.error('Trigger journey error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to trigger journey',
            message: error.response?.data?.errors?.[0] || error.message
        });
    }
});

export default router;