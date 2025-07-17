# Teams Scheduling Assistant Bot 🤖📅

An intelligent Microsoft Teams bot that helps users schedule meetings, manage calendars, book rooms, and resolve scheduling conflicts using natural language processing and Microsoft Graph API.

## 🌟 Features

### Core Scheduling Capabilities
- **Smart Meeting Booking**: Schedule meetings using natural language commands
- **Calendar Integration**: Connect with Microsoft Graph to check availability
- **Conflict Detection**: Automatically detect and resolve scheduling conflicts
- **Room Booking**: Find and reserve meeting rooms based on capacity and equipment needs
- **Teams Integration**: Generate Teams meeting links automatically

### Intelligent Features
- **Natural Language Processing**: Understand scheduling requests in plain English
- **Availability Checking**: Check when attendees are free across calendars
- **Smart Suggestions**: Recommend optimal meeting times based on patterns
- **Conflict Resolution**: Provide alternative time slots when conflicts exist
- **Proactive Notifications**: Send reminders and updates via Teams

### User Experience
- **Adaptive Cards**: Rich interactive cards for scheduling workflows
- **Conversational Interface**: Chat-based scheduling with contextual responses
- **Multi-language Support**: Extensible for different languages and locales
- **Accessibility**: Designed with accessibility best practices

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Microsoft Teams developer account
- Azure subscription for Bot Framework and Graph API
- VS Code (recommended)

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd teams-scheduling-assistant
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration values
   ```

3. **Required Environment Variables**
   ```
   MicrosoftAppId=your-bot-app-id
   MicrosoftAppPassword=your-bot-app-password
   CLIENT_ID=your-azure-app-client-id
   CLIENT_SECRET=your-azure-app-client-secret
   TENANT_ID=your-azure-tenant-id
   PORT=3978
   ```

4. **Build and Run**
   ```bash
   npm run build
   npm start
   ```

## 🏗️ Architecture

### Project Structure
```
src/
├── bots/
│   └── schedulingBot.ts          # Main bot logic and conversation handling
├── services/
│   ├── graphService.ts           # Microsoft Graph API integration
│   ├── schedulingCardService.ts  # Adaptive Cards for UI
│   └── conflictResolutionService.ts # Conflict detection & resolution
├── models/
│   └── types.ts                  # TypeScript interfaces and types
├── utils/
│   ├── nlpUtils.ts              # Natural language processing
│   └── dateTimeUtils.ts         # Date/time utility functions
└── index.ts                     # Entry point and server setup
```

### Key Components

#### SchedulingBot (`src/bots/schedulingBot.ts`)
The main bot class that handles:
- Teams activity events (messages, adaptive card interactions)
- Natural language intent recognition
- Conversation flow management
- Integration with backend services

#### GraphService (`src/services/graphService.ts`)
Microsoft Graph API integration for:
- Calendar operations (create, update, delete meetings)
- Availability checking (free/busy time lookup)
- Room and resource booking
- User profile and settings management

#### SchedulingCardService (`src/services/schedulingCardService.ts`)
Creates rich interactive experiences with:
- Scheduling forms and time pickers
- Availability displays and conflict notifications
- Room selection and booking confirmations
- Help and onboarding cards

#### ConflictResolutionService (`src/services/conflictResolutionService.ts`)
Intelligent scheduling assistance:
- Conflict detection across multiple calendars
- Alternative time slot suggestions
- Automatic conflict resolution strategies
- Meeting pattern analysis and recommendations

## 💬 Usage Examples

### Scheduling Commands
- "Schedule a meeting with john@company.com tomorrow at 2 PM"
- "Book the conference room for Friday afternoon"
- "When is everyone available this week?"
- "Find a 30-minute slot for our team standup"
- "Move my 3 PM meeting to 4 PM"

### Room Booking
- "I need a room for 10 people with a projector"
- "Book conference room A for tomorrow morning"
- "Find a space near the executive floor"

### Availability Queries
- "What's my schedule looking like today?"
- "When is Sarah free this week?"
- "Show me available time slots for Monday"

## 🛠️ Development

### Build Commands
```bash
npm run build      # Compile TypeScript
npm run watch      # Watch mode for development
npm run dev        # Build and run in development mode
npm start          # Run the compiled application
```

### Code Structure Guidelines
- **Services**: Stateless business logic and external API integration
- **Models**: TypeScript interfaces and type definitions
- **Utils**: Pure functions for common operations
- **Bots**: Teams activity handlers and conversation logic

### Adding New Features
1. Define interfaces in `src/models/types.ts`
2. Implement business logic in appropriate service files
3. Add UI components in `schedulingCardService.ts`
4. Update bot handlers in `schedulingBot.ts`
5. Add utility functions as needed

## 🔧 Configuration

### Teams App Manifest
The bot requires a Teams app manifest with appropriate permissions:
- **Bot capabilities**: Messaging, adaptive cards
- **Graph permissions**: Calendar.ReadWrite, Calendars.Read.Shared
- **Scopes**: Personal, team, group chat

### Microsoft Graph Permissions
Required delegated permissions:
- `Calendar.ReadWrite` - Create and modify meetings
- `Calendar.Read.Shared` - Check others' availability
- `Place.Read.All` - Access room information
- `User.Read` - Basic user profile access

## 🧪 Testing

### Bot Framework Emulator
1. Download the [Bot Framework Emulator](https://aka.ms/bot-framework-emulator)
2. Connect to `http://localhost:3978/api/messages`
3. Use your bot credentials for testing

### Teams Testing
1. Upload the app package to Teams
2. Install the bot in a team or personal scope
3. Test conversational flows and adaptive card interactions

## 📚 Documentation

### Key Resources
- [Bot Framework Documentation](https://docs.microsoft.com/en-us/azure/bot-service/)
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/)
- [Teams Platform Documentation](https://docs.microsoft.com/en-us/microsoftteams/platform/)
- [Adaptive Cards](https://adaptivecards.io/)

### API Reference
Detailed API documentation for each service is available in the source code comments using JSDoc format.

## 🔒 Security

### Authentication
- Uses Microsoft App credentials for bot authentication
- Implements OAuth 2.0 flow for Graph API access
- Supports both application and delegated permissions

### Data Privacy
- No sensitive data stored locally
- All calendar data accessed through Microsoft Graph
- Follows Microsoft's data handling guidelines

## 🚀 Deployment

### Azure Deployment
1. Create Azure Bot Service resource
2. Configure app settings with environment variables
3. Deploy code to Azure App Service
4. Update Teams app manifest with production endpoint

### Docker Support
```dockerfile
# Add Dockerfile for containerized deployment
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

For questions and support:
- Create an issue in this repository
- Check the [Teams Platform Community](https://docs.microsoft.com/en-us/microsoftteams/platform/feedback)
- Review [Bot Framework samples](https://github.com/Microsoft/BotBuilder-Samples)

---

**Built with ❤️ for Microsoft Teams using Bot Framework and Microsoft Graph**
