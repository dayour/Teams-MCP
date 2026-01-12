# Teams MCP - Model Context Protocol for Microsoft Teams

```
 _____                          __  __  ____ ____  
|_   _|__  __ _ _ __ ___  ___  |  \/  |/ ___|  _ \ 
  | |/ _ \/ _` | '_ ` _ \/ __| | |\/| | |   | |_) |
  | |  __/ (_| | | | | | \__ \ | |  | | |___|  __/ 
  |_|\___|\__,_|_| |_| |_|___/ |_|  |_|\____|_|    
                                                    
  Microsoft Teams Integration for AI Assistants
```

**Transform your AI assistant with powerful Microsoft Teams integration**

Teams MCP is a production-ready Model Context Protocol server that enables AI assistants like Claude Desktop and GitHub Copilot to seamlessly interact with Microsoft Teams for calendar management, meeting scheduling, and room booking through natural language commands.

## New: GitHub Copilot Integration

**Use Teams directly in GitHub Copilot chat with the @teams participant**

```
@teams /schedule meeting with john@company.com tomorrow at 2pm
@teams /availability check who's free for Friday afternoon
@teams /calendar show today's events
@teams /rooms find conference room for 10 people
```

**[See GitHub Copilot Integration Guide](GITHUB-COPILOT-INTEGRATION.md)**

## Quick Start

### Easy Installation (Recommended)

```bash
# Clone the repository
git clone https://github.com/dayour/Teams-MCP.git
cd Teams-MCP

# Install and configure everything automatically
npm install
npm run setup

# Start using with Claude Desktop
```

### Manual Installation

```bash
# Install dependencies and build
npm install && npm run build

# Authenticate with Microsoft
npm run auth

# Configure Claude Desktop
npm run configure-claude

# Start the MCP server
npm run mcp-server
```

## Features

- **Natural Language Meeting Management**: Schedule, update, and cancel meetings with AI
- **Calendar Integration**: Check availability and get calendar overviews  
- **Room Booking**: Find and reserve meeting rooms with equipment requirements
- **Conflict Resolution**: Smart alternative time suggestions
- **Microsoft Facilitator Agent Support**: Built-in support for Windows 11 ODR and agent-to-agent communication
- **Security & Governance**: Comprehensive audit logging and authorization for enterprise compliance
- **Easy Authentication**: Device-based auth with no Azure setup required
- **Auto-Configuration**: Automatic Claude Desktop integration
- **GitHub Copilot Integration**: Use @teams directly in VS Code Copilot chat
- **VS Code Extension**: Full extension with server management and authentication
- **Docker Support**: Containerized deployment for production environments
- **Persistent Profiles**: Multiple profile support for different Microsoft tenants

## Usage Examples

### With Claude Desktop:
```
"Schedule a meeting with john@company.com tomorrow at 2 PM"
"Find a conference room for 10 people with a projector"
"When is everyone available this week?"
"Reschedule my 3 PM meeting to avoid conflicts"
```

### With GitHub Copilot in VS Code:
```
@teams /schedule meeting with team@company.com Friday 3pm
@teams /availability check john@company.com for tomorrow
@teams /calendar show this week's meetings
@teams /rooms find room for 8 people with video equipment
```

## Architecture

This repository has been transformed from a Teams bot into a **Model Context Protocol (MCP) server** with full integration support:

- **MCP Server**: Exposes Teams functionality via standardized protocol
- **Claude Desktop Integration**: Works seamlessly with Claude Desktop
- **GitHub Copilot Integration**: @teams chat participant in VS Code
- **VSCode Extension**: Auto-configuration and server management
- **Device Authentication**: No Azure app registration required
- **Microsoft Graph API**: Full integration with Microsoft Graph for calendar operations
- **Docker Support**: Production-ready containerized deployment
- **Easy Setup**: One-command installation and configuration

## Available Tools

The MCP server provides these tools to AI assistants:

| Tool | Description |
|------|-------------|
| `schedule_meeting` | Schedule new meetings with attendees and Teams links |
| `check_availability` | Check attendee availability for time ranges |
| `find_available_rooms` | Find meeting rooms by capacity and equipment |
| `cancel_meeting` | Cancel existing meetings |
| `update_meeting` | Modify existing meetings |
| `get_my_calendar` | Get calendar events for date ranges |
| `resolve_conflicts` | Find alternative times when conflicts exist |

## Configuration

### Authentication Methods

**Device Authentication (Default)**
- No Azure setup required
- Uses Microsoft's device code flow
- Perfect for individual users

**Azure App Registration**
- For enterprise scenarios
- Requires Azure AD configuration
- More control over permissions

### Multiple Profiles Support

Teams MCP supports multiple profiles for different Microsoft tenants or users:

```bash
# Create a new profile
npm run profile create work 14d82eec-204b-4c2f-b7e8-296a70dab67e

# List all profiles
npm run profile list

# Switch to a different profile
npm run profile use work

# Show active profile
npm run profile active
```

### Status Check

```bash
npm run setup-status
```

## Development

### Project Structure

```
Teams-MCP/
├── src/
│   ├── mcp-server.ts           # Main MCP server
│   ├── auth-helper.ts          # Authentication utilities  
│   ├── claude-config.ts        # Claude Desktop configuration
│   ├── setup.ts               # Installation automation
│   └── services/              # Microsoft Graph integration
├── vscode-extension/          # VSCode extension for auto-config
├── docker/                    # Docker configuration
└── lib/                      # Compiled JavaScript
```

### Building

```bash
npm run build              # Build the project
npm run build-extension    # Build VSCode extension
npm run build-all          # Build everything
```

### Docker Deployment

```bash
# Build Docker image
docker build -t teams-mcp:latest .

# Run with docker-compose (recommended)
docker-compose up -d

# Check logs
docker-compose logs -f teams-mcp

# Stop
docker-compose down
```

**See [Docker Deployment Guide](DOCKER.md) for production deployment details.**

## Documentation

- **[Installation Guide](TEAMS-MCP-README.md)** - Detailed setup instructions
- **[API Reference](API.md)** - Complete API documentation for all MCP tools
- **[Facilitator Agent Guide](FACILITATOR-AGENT.md)** - Microsoft agent integration and ODR
- **[Docker Guide](DOCKER.md)** - Production deployment with Docker
- **[GitHub Copilot Guide](GITHUB-COPILOT-INTEGRATION.md)** - Copilot integration
- **[Changelog](CHANGELOG.md)** - Version history and release notes
- **[Original Setup](SETUP.md)** - Legacy Teams bot setup (deprecated)
- **[VSCode Extension](vscode-extension/)** - Extension documentation

## Migration from Teams Bot

This project was originally a Teams bot and has been transformed into an MCP server:

- **Teams Bot to MCP Server**: Core functionality preserved but exposed via MCP
- **Restify Server to Stdio Protocol**: Changed from HTTP to MCP stdio transport
- **Adaptive Cards to Tool Responses**: UI moved to AI assistant side
- **Teams Integration to Universal AI**: Works with any MCP-compatible AI assistant

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- [Documentation](TEAMS-MCP-README.md)
- [Report Issues](https://github.com/dayour/Teams-MCP/issues)
- [Discussions](https://github.com/dayour/Teams-MCP/discussions)

---

**Built for the AI assistant ecosystem**

Transform your productivity with AI-powered Teams integration.
