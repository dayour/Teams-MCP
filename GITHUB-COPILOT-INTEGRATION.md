# Teams MCP GitHub Copilot Integration

This document explains how to use the new GitHub Copilot integration with Teams MCP.

## Overview

The Teams MCP VS Code extension now includes a **GitHub Copilot Chat Participant** that makes Microsoft Teams scheduling and calendar tools available directly in Copilot chat.

## Setup

1. Install the Teams MCP VS Code extension
2. Configure authentication using the Command Palette:
   - `Ctrl+Shift+P` → "Teams MCP: Configure"
3. Ensure GitHub Copilot is installed and active in VS Code

## Usage

Once configured, you can use Teams scheduling features directly in GitHub Copilot chat by using the `@teams` participant.

### Available Commands

#### Schedule Meetings
```
@teams /schedule meeting with john@company.com tomorrow at 2pm
@teams /schedule "Project Review" with team@company.com on Friday 3-4pm
```

#### Check Availability  
```
@teams /availability check john@company.com and jane@company.com for tomorrow
@teams /availability when is everyone free this week?
```

#### View Calendar
```
@teams /calendar show today's events
@teams /calendar what's on my schedule for Friday?
```

#### Find Meeting Rooms
```
@teams /rooms find room for 10 people tomorrow 2-3pm
@teams /rooms available conference rooms with video equipment
```

#### Cancel Meetings
```
@teams /cancel meeting ID 12345
@teams /cancel today's 3pm meeting
```

#### Update Meetings
```
@teams /update meeting ID 12345 move to 4pm
@teams /update add jane@company.com to project meeting
```

## Example Conversation

```
You: @teams /schedule team standup with dev-team@company.com every Monday at 9am

Teams: ✅ Meeting scheduled: "team standup"
📅 Time: every Monday at 9am
👥 Attendees: dev-team@company.com
📍 Location: Teams meeting

*Note: This is a demonstration. Actual meeting creation requires authentication.*

You: @teams /availability check if everyone is free tomorrow 2-3pm

Teams: Availability check for: dev-team@company.com
📅 Time range: tomorrow 2-3pm

✅ Available slots found:
• 9:00 AM - 10:00 AM
• 2:00 PM - 3:00 PM  
• 4:00 PM - 5:00 PM
```

## Benefits

- **Seamless Integration**: No need to switch between applications
- **Natural Language**: Use conversational language to schedule meetings  
- **Context Aware**: Copilot understands your scheduling intent
- **Quick Actions**: Fast scheduling without complex UI navigation
- **Consistent Interface**: All Teams actions available in one place

## Authentication

The integration uses the same authentication as the Teams MCP server:

- **Device Authentication** (Recommended): Uses your existing Microsoft account
- **Azure App Registration**: For advanced users with custom configurations

Configure authentication via:
`Ctrl+Shift+P` → "Teams MCP: Configure"

## Troubleshooting

If the @teams participant is not available:

1. Ensure GitHub Copilot is installed and activated
2. Restart VS Code after installing the Teams MCP extension
3. Check that authentication is properly configured
4. Verify the MCP server is running: `Ctrl+Shift+P` → "Teams MCP: Show Status"

## Technical Details

The integration works by:

1. **Chat Participant**: Registers `@teams` as a GitHub Copilot chat participant
2. **Natural Language Processing**: Parses user intent from conversational text
3. **MCP Server Communication**: Translates requests to MCP protocol calls
4. **Microsoft Graph Integration**: Executes actual Teams/Calendar operations
5. **Response Formatting**: Returns user-friendly results in chat

The participant supports rich interactions including follow-up suggestions and contextual help.