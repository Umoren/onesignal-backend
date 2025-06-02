import 'dotenv/config';
import express from 'express';
import OneSignalService from '../services/onesignal.js';

const router = express.Router();
const oneSignal = new OneSignalService();

// Health check
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'email',
        provider: 'onesignal',
        timestamp: new Date().toISOString()
    });
});

// Send immediate email
router.post('/send', async (req, res) => {
    try {
        const { email, subject, body, userId, customData } = req.body;

        // Validation
        if (!email || !subject || !body) {
            return res.status(400).json({
                error: 'Missing required fields: email, subject, body'
            });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email format'
            });
        }

        console.log(`📧 Sending immediate email to: ${email}`);

        const result = await oneSignal.sendEmail({
            email,
            subject,
            body,
            userId,
            customData: customData || {}
        });

        res.json({
            message: 'Email sent successfully',
            email,
            notificationId: result.id,
            recipients: result.recipients,
            success: true
        });

    } catch (error) {
        console.error('Email send error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to send email',
            message: error.response?.data?.errors?.[0] || error.message
        });
    }
});

// Send delayed email
router.post('/send/delayed', async (req, res) => {
    try {
        const {
            email,
            subject,
            body,
            userId,
            customData,
            delayAmount = 30,
            delayUnit = 'seconds'
        } = req.body;

        // Validation
        if (!email || !subject || !body) {
            return res.status(400).json({
                error: 'Missing required fields: email, subject, body'
            });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email format'
            });
        }

        if (!oneSignal.isValidDelayUnit(delayUnit)) {
            return res.status(400).json({
                error: 'Invalid delay unit. Must be one of: seconds, minutes, hours, days, timezone'
            });
        }

        console.log(`📧⏰ Scheduling email for: ${email} - ${delayAmount} ${delayUnit}`);

        const result = await oneSignal.sendDelayedEmail({
            email,
            subject,
            body,
            userId,
            customData: customData || {},
            delayAmount,
            delayUnit
        });

        const delayText = delayUnit === 'timezone'
            ? `at ${delayAmount}`
            : `in ${delayAmount} ${delayUnit}`;

        res.json({
            message: `Email scheduled ${delayText}`,
            email,
            notificationId: result.id,
            recipients: result.recipients,
            scheduledFor: delayUnit !== 'timezone' ?
                new Date(Date.now() + oneSignal.convertToSeconds(delayAmount, delayUnit) * 1000).toISOString() :
                `${delayAmount} in user's timezone`,
            success: true
        });

    } catch (error) {
        console.error('Delayed email error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to schedule email',
            message: error.response?.data?.errors?.[0] || error.message
        });
    }
});


// Send email to segment
router.post('/send/segment', async (req, res) => {
    try {
        const { segment, subject, body, customData } = req.body;

        // Validation
        if (!segment || !subject || !body) {
            return res.status(400).json({
                error: 'Missing required fields: segment, subject, body'
            });
        }

        console.log(`📧👥 Sending email to segment: ${segment}`);

        const result = await oneSignal.sendEmailToSegment({
            segment,
            subject,
            body,
            customData: customData || {}
        });

        res.json({
            message: `Email sent to segment: ${segment}`,
            notificationId: result.id,
            recipients: result.recipients,
            success: true
        });

    } catch (error) {
        console.error('Segment email error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to send email to segment',
            message: error.response?.data?.errors?.[0] || error.message
        });
    }
});

export default router;