# Teams Scheduling Assistant - Setup Guide

## Quick Start

### 1. Azure Bot Setup
1. Go to [Azure Portal](https://portal.azure.com)
2. Create a new **Azure Bot Service**
3. Copy the **App ID** and **App Password**
4. Set the messaging endpoint: `https://your-domain.com/api/messages`

### 2. Microsoft Graph Registration
1. Go to [Azure Active Directory](https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade)
2. Navigate to **App registrations** → **New registration**
3. Configure permissions:
   - `Calendar.ReadWrite` (Delegated)
   - `Calendar.Read.Shared` (Delegated) 
   - `Calendars.ReadWrite` (Application)
   - `Place.Read.All` (Application)
   - `User.Read` (Delegated)

### 3. Environment Configuration
Copy `.env.example` to `.env` and fill in:

```env
MicrosoftAppId=<YOUR_BOT_APP_ID>
MicrosoftAppPassword=<YOUR_BOT_APP_PASSWORD>
CLIENT_ID=<YOUR_AZURE_APP_CLIENT_ID>
CLIENT_SECRET=<YOUR_AZURE_APP_CLIENT_SECRET>
TENANT_ID=<YOUR_AZURE_TENANT_ID>
PORT=3978
```

### 4. Teams App Setup
1. Update `manifest/manifest.json` with your IDs
2. Create app icons (color.png: 192x192, outline.png: 32x32)
3. Zip the manifest folder
4. Upload to Teams via **Apps** → **Manage your apps** → **Upload an app**

### 5. Local Development
```bash
npm install
npm run build
npm start
```

Use [Bot Framework Emulator](https://aka.ms/bot-framework-emulator) to test locally.

## Features Overview

### Natural Language Commands
- "Schedule a meeting with john@company.com tomorrow at 2 PM"
- "Book a conference room for 10 people with a projector"
- "When is everyone available this week?"
- "Find a 30-minute slot for our team standup"

### Smart Capabilities
- **Conflict Detection**: Automatically detect scheduling conflicts
- **Room Booking**: Find rooms based on capacity and equipment
- **Availability Checking**: Check free/busy status across calendars
- **Teams Integration**: Generate meeting links automatically

### Adaptive Card Interactions
- Rich scheduling forms with date/time pickers
- Room selection with capacity and equipment details
- Conflict resolution with alternative suggestions
- Booking confirmations with meeting details

## Deployment Options

### Azure App Service
```bash
# Build for production
npm run build

# Deploy to Azure App Service
# (Configure deployment center in Azure Portal)
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY lib/ ./lib/
EXPOSE 3978
CMD ["node", "lib/index.js"]
```

## Troubleshooting

### Common Issues

**Authentication Errors**
- Verify App ID and Password in `.env`
- Check Azure Bot Service messaging endpoint
- Ensure Microsoft Graph permissions are granted

**Graph API Errors**
- Verify client credentials and tenant ID
- Check Graph API permissions in Azure AD
- Ensure admin consent is provided for application permissions

**Teams Installation Issues**
- Verify manifest.json syntax and required fields
- Check app icons are correct size and format
- Ensure bot ID matches Azure Bot Service

### Debug Mode
Run in debug mode to see detailed logs:
```bash
npm run dev
```

Connect Bot Framework Emulator to `http://localhost:3978/api/messages`

## Advanced Configuration

### Custom Room Lists
Update `graphService.ts` to connect to your organization's room lists:
```typescript
// Customize room booking logic
async getAvailableRooms(): Promise<Room[]> {
    // Your organization's room API integration
}
```

### Meeting Policies
Configure meeting policies in `conflictResolutionService.ts`:
```typescript
// Add custom conflict resolution rules
private async checkOrganizationPolicies(meetingData: any): Promise<boolean> {
    // Your organization's scheduling policies
}
```

### Notifications
Extend notification capabilities in the bot:
```typescript
// Add proactive messaging for reminders
private async sendMeetingReminder(meeting: Meeting): Promise<void> {
    // Custom reminder logic
}
```

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **Permissions**: Use least-privilege principle for Graph permissions
3. **Validation**: Validate all user inputs and meeting data
4. **Logging**: Implement proper logging without exposing sensitive data
5. **Rate Limiting**: Implement rate limiting for API calls

## Support

For assistance:
1. Check the troubleshooting section above
2. Review [Bot Framework documentation](https://docs.microsoft.com/en-us/azure/bot-service/)
3. Consult [Microsoft Graph documentation](https://docs.microsoft.com/en-us/graph/)
4. Open an issue in the project repository
