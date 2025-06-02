import 'dotenv/config';
import axios from 'axios';

class OneSignalService {
    constructor() {
        this.appId = process.env.ONESIGNAL_APP_ID;
        this.apiKey = process.env.ONESIGNAL_API_KEY;
        this.apiUrl = process.env.ONESIGNAL_API_URL || 'https://api.onesignal.com';

        if (!this.appId || !this.apiKey) {
            throw new Error('ONESIGNAL_APP_ID and ONESIGNAL_API_KEY are required');
        }

        this.client = axios.create({
            baseURL: this.apiUrl,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Key ${this.apiKey}`
            }
        });
    }

    // Send immediate push notification
    async sendPushNotification({ userId, title, body, data = {}, segment = null }) {
        const payload = {
            app_id: this.appId,
            target_channel: 'push',
            headings: { en: title },
            contents: { en: body },
            data: data
        };

        // Target specific user or segment
        if (userId) {
            payload.include_aliases = { external_id: [userId] };
        } else if (segment) {
            payload.included_segments = [segment];
        } else {
            payload.included_segments = ['Subscribed Users']; // Default
        }

        const response = await this.client.post('/notifications', payload);
        return response.data;
    }

    // Send delayed push notification
    async sendDelayedPushNotification({
        userId,
        title,
        body,
        data = {},
        delayAmount = 30,
        delayUnit = 'seconds',
        segment = null
    }) {
        const payload = {
            app_id: this.appId,
            target_channel: 'push',
            headings: { en: title },
            contents: { en: body },
            data: data
        };

        // Add delay configuration
        if (delayUnit === 'seconds' || delayUnit === 'minutes' || delayUnit === 'hours') {
            const delayInSeconds = this.convertToSeconds(delayAmount, delayUnit);
            const sendAfter = new Date(Date.now() + delayInSeconds * 1000).toISOString();
            payload.send_after = sendAfter;
        } else if (delayUnit === 'timezone') {
            payload.delayed_option = 'timezone';
            payload.delivery_time_of_day = delayAmount; // e.g., "9:00AM"
        }

        // Target specific user or segment
        if (userId) {
            payload.include_aliases = { external_id: [userId] };
        } else if (segment) {
            payload.included_segments = [segment];
        } else {
            payload.included_segments = ['Subscribed Users'];
        }

        const response = await this.client.post('/notifications', payload);
        return response.data;
    }

    // Send immediate email
    async sendEmail({ email, subject, body, userId = null, customData = {} }) {
        const payload = {
            app_id: this.appId,
            target_channel: 'email',
            email_subject: subject,
            email_body: body,
            include_email_tokens: [email]
        };

        // Add user identification if provided
        if (userId) {
            payload.include_aliases = { external_id: [userId] };
        }

        // Add personalization data
        if (Object.keys(customData).length > 0) {
            payload.custom_data = customData;
        }

        const response = await this.client.post('/notifications', payload);
        return response.data;
    }

    // Send delayed email
    async sendDelayedEmail({
        email,
        subject,
        body,
        userId = null,
        customData = {},
        delayAmount = 30,
        delayUnit = 'seconds'
    }) {
        const payload = {
            app_id: this.appId,
            target_channel: 'email',
            email_subject: subject,
            email_body: body,
            include_email_tokens: [email]
        };

        // Add delay configuration
        if (delayUnit === 'seconds' || delayUnit === 'minutes' || delayUnit === 'hours') {
            const delayInSeconds = this.convertToSeconds(delayAmount, delayUnit);
            const sendAfter = new Date(Date.now() + delayInSeconds * 1000).toISOString();
            payload.send_after = sendAfter;
        } else if (delayUnit === 'timezone') {
            payload.delayed_option = 'timezone';
            payload.delivery_time_of_day = delayAmount; // e.g., "9:00AM"
        }

        // Add user identification if provided
        if (userId) {
            payload.include_aliases = { external_id: [userId] };
        }

        // Add personalization data
        if (Object.keys(customData).length > 0) {
            payload.custom_data = customData;
        }

        const response = await this.client.post('/notifications', payload);
        return response.data;
    }

    // Send to email segment
    async sendEmailToSegment({ segment, subject, body, customData = {} }) {
        const payload = {
            app_id: this.appId,
            target_channel: 'email',
            email_subject: subject,
            email_body: body,
            included_segments: [segment]
        };

        if (Object.keys(customData).length > 0) {
            payload.custom_data = customData;
        }

        const response = await this.client.post('/notifications', payload);
        return response.data;
    }

    // Get notification details
    async getNotification(notificationId) {
        const response = await this.client.get(`/notifications/${notificationId}`);
        return response.data;
    }

    // Cancel scheduled notification
    async cancelNotification(notificationId) {
        const response = await this.client.delete(`/notifications/${notificationId}`);
        return response.data;
    }

    // Create user with External ID (for Journey testing)
    async createUser({ externalId, email, firstName, companyName }) {
        const payload = {
            aliases: {
                external_id: externalId
            },
            properties: {
                tags: {
                    first_name: firstName,
                    company_name: companyName
                }
            }
        };

        // Add email subscription if provided
        if (email) {
            payload.subscriptions = [
                {
                    type: 'Email',
                    token: email,
                    enabled: true
                }
            ];
        }

        const response = await this.client.post('/users', payload);
        return response.data;
    }

    // Add user to segment (triggers Journey)
    async addUserToSegment(externalId, segmentTag, segmentValue) {
        const payload = {
            properties: {
                tags: {
                    [segmentTag]: segmentValue
                }
            }
        };

        const response = await this.client.patch(`/users/by/external_id/${externalId}`, payload);
        return response.data;
    }

    // Test API connectivity
    async testConnection() {
        try {
            console.log('🧪 Testing API connectivity...');

            // Try to get app info (simple test)
            const response = await this.client.get(`/apps/${this.appId}`);

            return {
                success: true,
                api: 'new',
                url: this.client.defaults.baseURL,
                app: response.data
            };

        } catch (newApiError) {
            console.log('New API test failed, trying legacy API...');

            try {
                // Test legacy API
                const legacyClient = axios.create({
                    baseURL: this.legacyBaseURL,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${this.apiKey}`
                    },
                    timeout: 30000
                });

                const response = await legacyClient.get(`/apps/${this.appId}`);

                return {
                    success: true,
                    api: 'legacy',
                    url: this.legacyBaseURL,
                    app: response.data
                };

            } catch (legacyApiError) {
                return {
                    success: false,
                    newApiError: newApiError.message,
                    legacyApiError: legacyApiError.message,
                    suggestion: 'Check your API key and App ID. Make sure your API key is the REST API Key from Settings > Keys & IDs'
                };
            }
        }
    }
    convertToSeconds(amount, unit) {
        const conversions = {
            seconds: 1,
            minutes: 60,
            hours: 3600,
            days: 86400
        };
        return amount * (conversions[unit] || 1);
    }

    // Validate delay unit
    isValidDelayUnit(unit) {
        return ['seconds', 'minutes', 'hours', 'days', 'timezone'].includes(unit);
    }
}

export default OneSignalService;