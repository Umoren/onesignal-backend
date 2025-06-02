
import 'dotenv/config';
import express from 'express';
import OneSignalService from '../services/onesignal.js';

const router = express.Router();
const oneSignal = new OneSignalService();

// Health check
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'notifications',
        provider: 'onesignal',
        timestamp: new Date().toISOString()
    });
});

// Send immediate push notification
router.post('/push', async (req, res) => {
    try {
        const { userId, title, body, data, segment } = req.body;

        // Validation
        if (!title || !body) {
            return res.status(400).json({
                error: 'Missing required fields: title, body'
            });
        }

        if (!userId && !segment) {
            return res.status(400).json({
                error: 'Either userId or segment must be provided'
            });
        }

        console.log(`📱 Sending immediate push to ${userId || segment}`);

        const result = await oneSignal.sendPushNotification({
            userId,
            title,
            body,
            data: data || {},
            segment
        });

        res.json({
            message: 'Push notification sent successfully',
            notificationId: result.id,
            recipients: result.recipients,
            success: true
        });

    } catch (error) {
        console.error('Push notification error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to send push notification',
            message: error.response?.data?.errors?.[0] || error.message
        });
    }
});

// Send delayed push notification
router.post('/push/delayed', async (req, res) => {
    try {
        const {
            userId,
            title,
            body,
            data,
            segment,
            delayAmount = 30,
            delayUnit = 'seconds'
        } = req.body;

        // Validation
        if (!title || !body) {
            return res.status(400).json({
                error: 'Missing required fields: title, body'
            });
        }

        if (!userId && !segment) {
            return res.status(400).json({
                error: 'Either userId or segment must be provided'
            });
        }

        if (!oneSignal.isValidDelayUnit(delayUnit)) {
            return res.status(400).json({
                error: 'Invalid delay unit. Must be one of: seconds, minutes, hours, days, timezone'
            });
        }

        console.log(`📱⏰ Scheduling push for ${userId || segment} - ${delayAmount} ${delayUnit}`);

        const result = await oneSignal.sendDelayedPushNotification({
            userId,
            title,
            body,
            data: data || {},
            segment,
            delayAmount,
            delayUnit
        });

        const delayText = delayUnit === 'timezone'
            ? `at ${delayAmount}`
            : `in ${delayAmount} ${delayUnit}`;

        res.json({
            message: `Push notification scheduled ${delayText}`,
            notificationId: result.id,
            recipients: result.recipients,
            scheduledFor: delayUnit !== 'timezone' ?
                new Date(Date.now() + oneSignal.convertToSeconds(delayAmount, delayUnit) * 1000).toISOString() :
                `${delayAmount} in user's timezone`,
            success: true
        });

    } catch (error) {
        console.error('Delayed push notification error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to schedule push notification',
            message: error.response?.data?.errors?.[0] || error.message
        });
    }
});

// Send push to segment
router.post('/push/segment', async (req, res) => {
    try {
        const { segment, title, body, data } = req.body;

        // Validation
        if (!segment || !title || !body) {
            return res.status(400).json({
                error: 'Missing required fields: segment, title, body'
            });
        }

        console.log(`📱👥 Sending push to segment: ${segment}`);

        const result = await oneSignal.sendPushNotification({
            title,
            body,
            data: data || {},
            segment
        });

        res.json({
            message: `Push notification sent to segment: ${segment}`,
            notificationId: result.id,
            recipients: result.recipients,
            success: true
        });

    } catch (error) {
        console.error('Segment push notification error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to send push notification to segment',
            message: error.response?.data?.errors?.[0] || error.message
        });
    }
});

// Get notification status
router.get('/push/:notificationId', async (req, res) => {
    try {
        const { notificationId } = req.params;

        const result = await oneSignal.getNotification(notificationId);

        res.json({
            message: 'Notification details retrieved',
            notification: result,
            success: true
        });

    } catch (error) {
        console.error('Get notification error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to get notification details',
            message: error.response?.data?.errors?.[0] || error.message
        });
    }
});

// Cancel scheduled notification
router.delete('/push/:notificationId', async (req, res) => {
    try {
        const { notificationId } = req.params;

        const result = await oneSignal.cancelNotification(notificationId);

        res.json({
            message: 'Notification cancelled successfully',
            notificationId,
            success: true
        });

    } catch (error) {
        console.error('Cancel notification error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to cancel notification',
            message: error.response?.data?.errors?.[0] || error.message
        });
    }
});

export default router;