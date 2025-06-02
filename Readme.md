# OneSignal Backend API

A Node.js Express API for integrating with OneSignal push notifications, email messaging, and Journey automation workflows.

## Features

- Push notification delivery (immediate and delayed)
- Email messaging with HTML templates
- User management with External IDs
- Journey workflow triggers
- Tag-based user segmentation

## Requirements

- Node.js 16+ 
- OneSignal account with App ID and REST API Key (starts with `os_v2_`)

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the root directory:

```
PORT=3001
ONESIGNAL_APP_ID=your_app_id_here
ONESIGNAL_API_KEY=your_rest_api_key_here
```

Get your credentials from OneSignal Dashboard > Settings > Keys & IDs.
**Important**: Use the new REST API Key that starts with `os_v2_`, not the legacy key.

## OneSignal Dashboard Setup

### 1. Push Notification Setup
1. Go to **Settings > Push & In-App > Push Platforms**
2. Configure your platforms:
   - **iOS**: Upload APNs certificate or configure token-based auth
   - **Android**: Upload Firebase Cloud Messaging JSON file
   - **Web**: Configure your site URL and upload VAPID keys

### 2. Email Setup
1. Go to **Settings > Email > Configuration**
2. **Authenticate your domain**:
   - Add your sending domain
   - Add required DNS records (SPF, DKIM, DMARC)
   - Verify domain authentication
3. **Configure sender details**:
   - Set default sender name and email
   - Configure reply-to address

### 3. Create User Segments
1. Go to **Audience > Segments**
2. Click **New Segment**
3. **For Journey triggers**, create a segment with:
   - **Name**: "New Users" (or your preferred name)
   - **Filter**: User Tag > `new_users` > `is` > `true`
4. Click **Create Segment**

### 4. Journey Workflow Setup
1. Go to **Messages > Journeys**
2. Click **New Journey**
3. **Configure trigger**:
   - **Entry Trigger**: "When users enter segment"
   - **Select your segment**: Choose "New Users" (created above)
4. **Add workflow steps**:
   - **Wait**: Set delay duration (e.g., 10 minutes)
   - **Email**: Configure welcome email template
5. **Activate Journey**

## Usage

Start the server:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## API Endpoints

### Health Check
```
GET /health
```

### Push Notifications

#### Send Immediate Push
```
POST /api/notifications/push
Content-Type: application/json

{
  "userIds": ["user1", "user2"],
  "title": "Notification Title", 
  "body": "Notification message",
  "customData": {}
}
```

#### Send Delayed Push
```
POST /api/notifications/push/delayed
Content-Type: application/json

{
  "userId": "user123",
  "title": "Delayed Notification",
  "body": "This will be sent later",
  "delayAmount": 5,
  "delayUnit": "minutes"
}
```

### Email Messaging

#### Send Immediate Email
```
POST /api/emails/send
Content-Type: application/json

{
  "emails": ["user@example.com"],
  "subject": "Email Subject",
  "templateHtml": "<h1>Hello</h1><p>Email content</p>",
  "customData": {}
}
```

#### Send Delayed Email
```
POST /api/emails/send/delayed
Content-Type: application/json

{
  "email": "user@example.com",
  "subject": "Delayed Email",
  "templateHtml": "<h1>Hello</h1><p>Delayed content</p>",
  "delayAmount": 10,
  "delayUnit": "minutes"
}
```

### Journey Management

#### Test API Connection
```
GET /api/journeys/test-connection
```

#### Create User
```
POST /api/journeys/create-user
Content-Type: application/json

{
  "externalId": "user123",
  "email": "user@example.com",
  "firstName": "John",
  "companyName": "Example Corp"
}
```

#### Trigger Journey
```
POST /api/journeys/trigger-journey
Content-Type: application/json

{
  "externalId": "user123",
  "segmentTag": "new_users",
  "segmentValue": "true"
}
```

## Testing Journey Workflow

### Complete Flow Example
1. **Create user with email subscription**:
   ```bash
   curl -X POST http://localhost:3001/api/journeys/create-user \
     -H "Content-Type: application/json" \
     -d '{
       "externalId": "test-user-123",
       "email": "test@example.com",
       "firstName": "John",
       "companyName": "Test Corp"
     }'
   ```

2. **Trigger Journey** (adds user to segment):
   ```bash
   curl -X POST http://localhost:3001/api/journeys/trigger-journey \
     -H "Content-Type: application/json" \
     -d '{
       "externalId": "test-user-123"
     }'
   ```

3. **Journey executes automatically**:
   - User enters "New Users" segment
   - Wait period (as configured in dashboard)
   - Welcome email sent

## Parameters

### Delay Units
- `seconds`
- `minutes` 
- `hours`
- `days`
- `timezone`

### User Targeting
- `userIds`: Array of External User IDs
- `segments`: Array of segment names
- `emails`: Array of email addresses

## Error Handling

The API returns standard HTTP status codes:
- `200`: Success
- `400`: Bad Request (missing parameters)
- `500`: Server Error (OneSignal API issues)

Error responses include:
```json
{
  "error": "Error description",
  "message": "Detailed error message",
  "success": false
}
```

## Development

### Project Structure
```
src/
├── routes/
│   ├── notifications.js    # Push notification endpoints
│   ├── emails.js          # Email messaging endpoints
│   └── journeys.js        # Journey workflow endpoints
├── services/
│   └── onesignal.js       # OneSignal API integration
└── app.js                 # Express app configuration
```

### API Integration
This service uses OneSignal's current REST API (`https://api.onesignal.com`) with modern authentication and endpoints.

### Authentication
- **URL**: `https://api.onesignal.com`
- **Auth**: `Authorization: Key {your_api_key}`
- **API Key Format**: Must start with `os_v2_`

## License

MIT