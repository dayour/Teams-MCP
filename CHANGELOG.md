# Changelog

All notable changes to Teams MCP will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-01-01

### Added
- **Microsoft Facilitator Agent Support**: Enhanced MCP server to support agent-to-agent communication for Microsoft's agentic computing platform
- **Enhanced Security**: Upgraded critical dependencies to address security vulnerabilities

### Changed
- **Package Upgrades**: Updated all dependencies to latest stable versions
  - @azure/msal-node: 2.16.2 → 3.8.4 (major upgrade with enhanced security)
  - @modelcontextprotocol/sdk: 1.16.0 → 1.25.1 (security fix for DNS rebinding)
  - axios: 1.10.0 → 1.13.2 (DoS vulnerability fix)
  - botbuilder packages: 4.23.2 → 4.23.3
  - node-cron: 3.0.3 → 4.2.1
  - typescript: 5.8.3 → 5.9.3
  - @types/node: 20.19.7 → 20.19.27
  - nodemon: 3.1.10 → 3.1.11
  - adaptivecards: 3.0.4 → 3.0.5
- **VSCode Extension Package Upgrades**:
  - @azure/msal-node: 2.16.2 → 3.8.4
  - @modelcontextprotocol/sdk: 1.16.0 → 1.25.1
  - @types/vscode: 1.102.0 → 1.107.0
  - @vscode/test-cli: 0.0.4 → 0.0.12
  - @vscode/vsce: 2.32.0 → 3.7.1
  - typescript: 5.8.3 → 5.9.3
  - @types/node: 20.19.8 → 20.19.27

### Security
- Fixed 9 critical and high-severity vulnerabilities in main project
- Fixed 8 vulnerabilities in vscode-extension
- Upgraded @modelcontextprotocol/sdk to address DNS rebinding vulnerability (GHSA-w48q-cv73-mx4w)
- Upgraded axios to fix DoS vulnerability (GHSA-4hjh-wcwx-xvwj)
- Upgraded form-data, jws, qs, body-parser to address security issues
- All builds pass with zero compilation errors

### Notes
- Zod remains at 3.25.76 (v4 requires significant code changes, deferred to future release)
- Legacy Teams bot code (index.ts) deprecated in favor of MCP server (mcp-server.ts)
- Restify vulnerabilities noted but kept for backward compatibility (find-my-way, send)
- Validated full build process for both main project and VSCode extension

## [1.0.0] - 2024-12-13

### Added

#### Production Features
- **Docker Support**: Complete containerized deployment with Dockerfile, docker-compose.yml, and comprehensive deployment guide
- **Profile Manager**: Multi-tenant and multi-user profile support for managing different Microsoft tenants
- **Production Logger**: Comprehensive logging utility with multiple log levels (ERROR, WARN, INFO, DEBUG)
- **API Documentation**: Complete API documentation for all MCP tools with examples and best practices
- **Docker Deployment Guide**: Detailed guide for production deployment including security, scaling, and troubleshooting

#### Microsoft Graph Integration
- Replaced all mock implementations with actual Microsoft Graph API calls
- `createMeeting`: Full implementation with Teams meeting link generation
- `getCalendarEvents`: Retrieve calendar events using calendarView API
- `checkAvailability`: Get real-time availability using getSchedule API
- `findAvailableRooms`: Search for rooms using places API with capacity and equipment filtering
- `updateMeeting`: Update existing meetings via Graph API
- `cancelMeeting`: Cancel meetings via Graph API
- Proper error handling with Graph API specific errors

#### Documentation Improvements
- Cleaned up all README files, removed emojis, added professional ASCII art
- Enhanced README.md with production features section
- Improved TEAMS-MCP-README.md with clearer structure
- Updated GITHUB-COPILOT-INTEGRATION.md with better examples
- Added comprehensive Docker deployment guide (DOCKER.md)
- Added API documentation (API.md)

#### Configuration & DevOps
- Enhanced .env.example with all configuration options
- Improved .gitignore for production artifacts and build outputs
- Added .dockerignore for optimized Docker builds
- Added profile management commands to package.json
- Docker health checks and resource limits

### Changed

#### Code Quality
- Integrated logger throughout MCP server and GraphService
- Improved error handling with context-aware logging
- Enhanced GraphService with production-ready API calls
- Better authentication token management
- Improved freebusy parsing logic for correct status detection

#### Architecture
- MCP server now uses centralized logger
- GraphService tracks API call performance
- Better separation of concerns with utility modules
- Production-ready error handling patterns

### Fixed
- Fixed freebusy parsing logic to correctly identify "out of office" status
- Removed unused enableFile property from logger
- Improved error messages with user-friendly context
- Better handling of Microsoft Graph API errors

### Security
- Passed CodeQL security scan with 0 vulnerabilities
- Non-root Docker user configuration
- Secure token storage in isolated volumes
- Environment variable based configuration

## [0.9.0] - Previous Release

### Initial Features
- Model Context Protocol (MCP) server implementation
- Device authentication flow
- Basic meeting scheduling
- Claude Desktop integration
- VSCode extension
- GitHub Copilot integration

---

## Migration Guide

### From 0.9.0 to 1.0.0

#### Docker Users
If upgrading to Docker deployment:

1. Create a `.env` file from `.env.example`
2. Build the Docker image: `docker-compose build`
3. Start the container: `docker-compose up -d`

#### Profile Management
To use the new profile manager:

```bash
# Create a profile
npm run profile create work <client-id>

# List profiles
npm run profile list

# Switch profiles
npm run profile use work
```

#### Logging
To configure logging:

```bash
# Set log level (ERROR, WARN, INFO, DEBUG)
export LOG_LEVEL=DEBUG

# Disable console logging
export LOG_CONSOLE=false
```

#### API Changes
- All mock responses have been replaced with actual Microsoft Graph API calls
- Room finding now returns empty array if permissions are insufficient (instead of throwing)
- Enhanced error messages with specific guidance

---

## Upcoming Features

### Planned for 1.1.0
- Persistent storage for meeting history
- Advanced conflict resolution with ML-based suggestions
- Support for recurring meetings
- Calendar sharing and delegation
- Meeting analytics and insights
- FastAPI REST endpoints for external integrations
- Webhook support for calendar notifications

### Future Enhancements
- Multi-language support
- Advanced room booking with resource management
- Integration with other calendar platforms (Google Calendar, iCal)
- Meeting transcription integration
- Automated meeting notes and action items

---

## Support

For issues, questions, or contributions:
- [Report Issues](https://github.com/dayour/Teams-MCP/issues)
- [Discussions](https://github.com/dayour/Teams-MCP/discussions)
- [Pull Requests](https://github.com/dayour/Teams-MCP/pulls)
