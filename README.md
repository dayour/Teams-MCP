# Teams MCP - Model Context Protocol for Microsoft Teams

**Transform your AI assistant with powerful Microsoft Teams integration!**

Teams MCP is a Model Context Protocol server that enables AI assistants like Claude Desktop to seamlessly interact with Microsoft Teams for calendar management, meeting scheduling, and room booking through natural language commands.

## 🚀 Quick Start

### Easy Installation (Recommended)

```bash
# Clone the repository
git clone https://github.com/dayour/Teams-MCP.git
cd Teams-MCP

# Install and configure everything automatically
npm install
npm run setup

# Start using with Claude Desktop!
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

## 🎯 Features

- **🤖 Natural Language Meeting Management**: Schedule, update, and cancel meetings with AI
- **📅 Calendar Integration**: Check availability and get calendar overviews
- **🏢 Room Booking**: Find and reserve meeting rooms with equipment requirements
- **🔍 Conflict Resolution**: Smart alternative time suggestions
- **🔐 Easy Authentication**: Device-based auth with no Azure setup required
- **⚙️ Auto-Configuration**: Automatic Claude Desktop integration

## 💬 Usage Examples

Once configured, use natural language with Claude Desktop:

```
"Schedule a meeting with john@company.com tomorrow at 2 PM"
"Find a conference room for 10 people with a projector"
"When is everyone available this week?"
"Reschedule my 3 PM meeting to avoid conflicts"
```

## 🏗️ What's New

This repository has been transformed from a Teams bot into a **Model Context Protocol (MCP) server**:

- ✅ **MCP Server**: Exposes Teams functionality via standardized protocol
- ✅ **Claude Desktop Integration**: Works seamlessly with Claude Desktop
- ✅ **VSCode Extension**: Auto-configuration and management
- ✅ **Device Authentication**: No Azure app registration required
- ✅ **Easy Setup**: One-command installation and configuration

## 📋 Available Tools

The MCP server provides these tools to AI assistants:

| Tool | Description |
|------|-------------|
| `schedule_meeting` | Schedule new meetings with attendees |
| `check_availability` | Check attendee availability for time ranges |
| `find_available_rooms` | Find meeting rooms by capacity and equipment |
| `cancel_meeting` | Cancel existing meetings |
| `update_meeting` | Modify existing meetings |
| `get_my_calendar` | Get calendar events for date ranges |
| `resolve_conflicts` | Find alternative times when conflicts exist |

## 🔧 Configuration

### Authentication Methods

**Device Authentication (Default)**
- No Azure setup required
- Uses Microsoft's device code flow
- Perfect for individual users

**Azure App Registration**
- For enterprise scenarios
- Requires Azure AD configuration
- More control over permissions

### Status Check

```bash
npm run setup-status
```

## 🛠️ Development

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
└── lib/                      # Compiled JavaScript
```

### Building

```bash
npm run build              # Build the project
npm run build-extension    # Build VSCode extension
```

## 📖 Documentation

- **[Installation Guide](TEAMS-MCP-README.md)** - Detailed setup instructions
- **[Original Setup](SETUP.md)** - Legacy Teams bot setup (deprecated)
- **[VSCode Extension](vscode-extension/)** - Extension documentation

## 🔄 Migration from Teams Bot

This project was originally a Teams bot and has been transformed into an MCP server:

- **Teams Bot → MCP Server**: Core functionality preserved but exposed via MCP
- **Restify Server → Stdio Protocol**: Changed from HTTP to MCP stdio transport
- **Adaptive Cards → Tool Responses**: UI moved to AI assistant side
- **Teams Integration → Universal AI**: Works with any MCP-compatible AI assistant

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

- 📖 [Documentation](TEAMS-MCP-README.md)
- 🐛 [Report Issues](https://github.com/dayour/Teams-MCP/issues)
- 💬 [Discussions](https://github.com/dayour/Teams-MCP/discussions)

---

**Built with ❤️ for the AI assistant ecosystem**

Transform your productivity with AI-powered Teams integration!
