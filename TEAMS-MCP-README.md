# Teams MCP - Model Context Protocol for Microsoft Teams

**Transform your AI assistant with powerful Microsoft Teams integration!**

Teams MCP provides seamless integration between AI assistants (like Claude Desktop) and Microsoft Teams, enabling natural language control of your calendar, meetings, and room bookings.

## Features

### AI-Powered Meeting Management
- **Schedule meetings** with natural language commands
- **Check availability** across multiple attendees  
- **Book meeting rooms** with capacity and equipment requirements
- **Resolve conflicts** with intelligent alternative suggestions
- **Update and cancel** meetings easily
- **Get calendar overview** for any date range

### Easy Installation
- **No Azure app registration required** - uses device authentication
- **VSCode extension** for automatic setup and configuration
- **Claude Desktop integration** with automatic config generation
- **One-click authentication** flow

### Smart Capabilities
- Natural language processing for meeting requests
- Conflict detection and resolution
- Room availability checking with equipment filtering
- Teams meeting link generation
- Multi-attendee availability checking

## Installation Options

### Option 1: VSCode Extension (Recommended)

1. **Install the Extension**
   ```bash
   # Install from VSCode marketplace (coming soon)
   # or install locally:
   cd vscode-extension
   npm install && npm run compile
   code --install-extension teams-mcp-extension-1.0.0.vsix
   ```

2. **Configure Teams MCP**
   - Open VSCode Command Palette (`Ctrl+Shift+P`)
   - Run "Teams MCP: Configure Teams MCP Server"
   - Choose "Device Authentication (Recommended)"
   - Follow the authentication prompts

3. **Start Using with Claude Desktop**
   - The extension automatically configures Claude Desktop
   - Restart Claude Desktop
   - Start chatting with Teams MCP capabilities!

### Option 2: Manual Installation

1. **Clone and Build**
   ```bash
   git clone <repository-url>
   cd Teams-MCP
   npm install
   npm run build
   ```

2. **Authenticate**
   ```bash
   npm run auth
   ```

3. **Configure Claude Desktop**
   ```bash
   node lib/claude-config.js configure
   ```

4. **Start MCP Server**
   ```bash
   npm run mcp-server
   ```

## Usage Examples

Once installed, you can use natural language with your AI assistant:

### Meeting Scheduling
```
"Schedule a meeting with john@company.com and sarah@company.com tomorrow at 2 PM for 1 hour about project review"

"Book the large conference room for Friday afternoon from 2-4 PM"

"Find a 30-minute slot this week when everyone is available"
```

### Availability Checking
```
"When is the team available this week?"

"Check if Sarah is free tomorrow afternoon"

"Show me my calendar for next Monday"
```

### Conflict Resolution
```
"My 3 PM meeting conflicts with another appointment - find alternative times"

"Reschedule my meeting with the marketing team to avoid conflicts"
```

### Room Booking
```
"I need a room for 10 people with a projector for tomorrow morning"

"Find available conference rooms near the executive floor"

"Book conference room A for my team standup"
```

## Configuration

### Authentication Methods

#### Device Authentication (Default)
- **Easiest setup** - no Azure configuration required
- Uses Microsoft's device code flow
- Automatically handles token refresh
- Perfect for individual users

#### Azure App Registration
- For organizations with specific requirements
- Requires Azure AD app registration setup
- Provides more control over permissions

### Environment Variables

```env
# Only needed for Azure app registration method
CLIENT_ID=your-azure-app-client-id
CLIENT_SECRET=your-azure-app-client-secret  
TENANT_ID=your-azure-tenant-id
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Claude Desktop │    │   Teams MCP     │    │  Microsoft Graph│
│                 │◄──►│    Server       │◄──►│      API       │
│   (AI Assistant)│    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              ▲
                              │
                       ┌─────────────────┐
                       │ VSCode Extension│
                       │ (Auto Config)   │
                       └─────────────────┘
```

### Components

- **MCP Server**: Exposes Teams functionality via Model Context Protocol
- **VSCode Extension**: Manages server lifecycle and configuration  
- **Authentication Helper**: Handles Microsoft Graph authentication
- **Claude Config**: Automatically configures Claude Desktop

## Development

### Building from Source

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Test the MCP server
node lib/test-mcp.js

# Build VSCode extension
cd vscode-extension
npm install && npm run compile
```

### Available Scripts

```bash
npm run build          # Build TypeScript to JavaScript
npm run mcp-server     # Start the MCP server
npm run auth          # Run authentication flow
npm run build-extension # Build VSCode extension
```

### Project Structure

```
Teams-MCP/
├── src/
│   ├── mcp-server.ts          # Main MCP server
│   ├── auth-helper.ts         # Authentication utilities
│   ├── claude-config.ts       # Claude Desktop configuration
│   ├── services/
│   │   ├── graphService.ts    # Microsoft Graph integration
│   │   └── conflictResolutionService.ts
│   └── bots/                  # Original Teams bot (legacy)
├── vscode-extension/          # VSCode extension
│   ├── src/extension.ts       # Extension main file
│   └── package.json          # Extension manifest
└── lib/                      # Compiled JavaScript
```

## Troubleshooting

### Common Issues

**"Authentication failed"**
- Ensure you have a valid Microsoft account
- Check internet connectivity
- Try clearing authentication cache: `node lib/auth-helper.js clear`

**"Teams MCP not found in Claude Desktop"**
- Restart Claude Desktop after configuration
- Check Claude Desktop config file was updated
- Verify MCP server path is correct

**"No available rooms found"**
- Ensure your organization has configured room lists in Exchange
- Check if you have permissions to view room availability
- Some organizations restrict room booking features

### Debug Mode

Run the MCP server with debug logging:
```bash
DEBUG=true npm run mcp-server
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Requirements

- **Node.js** 16+ and npm
- **Microsoft account** with Teams/Office 365 access
- **Claude Desktop** (for AI assistant integration)
- **VSCode** (for extension-based setup)

## Security & Privacy

- **No data storage**: All calendar data accessed through Microsoft Graph
- **Token security**: Authentication tokens stored securely in OS keychain
- **Minimal permissions**: Only requests necessary Microsoft Graph permissions
- **Open source**: Full source code available for security review

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- [Documentation](https://github.com/dayour/Teams-MCP/wiki)
- [Report Issues](https://github.com/dayour/Teams-MCP/issues)
- [Discussions](https://github.com/dayour/Teams-MCP/discussions)

---

**Built for the AI assistant ecosystem**

Transform your productivity with AI-powered Teams integration.