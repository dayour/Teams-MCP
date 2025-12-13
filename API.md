# Teams MCP API Documentation

This document describes the available MCP tools and their usage.

## Available Tools

### 1. schedule_meeting

Schedule a new meeting with attendees and optional Teams meeting link.

**Input Schema:**
```json
{
  "subject": "string (required)",
  "attendeeEmails": ["string (email, required)"],
  "startDateTime": "string (ISO 8601, required)",
  "endDateTime": "string (ISO 8601, required)",
  "location": "string (optional)",
  "includeTeamsLink": "boolean (optional, default: true)"
}
```

**Example:**
```json
{
  "subject": "Project Sync",
  "attendeeEmails": ["john@company.com", "jane@company.com"],
  "startDateTime": "2024-12-15T14:00:00Z",
  "endDateTime": "2024-12-15T15:00:00Z",
  "location": "Conference Room A",
  "includeTeamsLink": true
}
```

**Response:**
```
✅ Meeting scheduled successfully!
📋 Subject: Project Sync
🆔 Meeting ID: AAMkAGE...
⏰ Time: 12/15/2024, 2:00:00 PM - 12/15/2024, 3:00:00 PM
👥 Attendees: john@company.com, jane@company.com
🔗 Teams Link: https://teams.microsoft.com/l/meetup-join/...
📍 Location: Conference Room A
```

---

### 2. check_availability

Check the availability of attendees for a specific time range.

**Input Schema:**
```json
{
  "attendeeEmails": ["string (email, required)"],
  "startDateTime": "string (ISO 8601, required)",
  "endDateTime": "string (ISO 8601, required)"
}
```

**Example:**
```json
{
  "attendeeEmails": ["john@company.com", "jane@company.com"],
  "startDateTime": "2024-12-15T14:00:00Z",
  "endDateTime": "2024-12-15T18:00:00Z"
}
```

**Response:**
```
Availability for 2024-12-15T14:00:00Z to 2024-12-15T18:00:00Z:

john@company.com: free (2024-12-15T14:00:00Z - 2024-12-15T18:00:00Z)
jane@company.com: busy (2024-12-15T14:00:00Z - 2024-12-15T18:00:00Z)
```

---

### 3. find_available_rooms

Find available meeting rooms for a specific time with optional capacity and equipment requirements.

**Input Schema:**
```json
{
  "startDateTime": "string (ISO 8601, required)",
  "endDateTime": "string (ISO 8601, required)",
  "capacity": "number (optional)",
  "equipment": ["string (optional)"]
}
```

**Example:**
```json
{
  "startDateTime": "2024-12-15T14:00:00Z",
  "endDateTime": "2024-12-15T15:00:00Z",
  "capacity": 10,
  "equipment": ["projector", "video_conference"]
}
```

**Response:**
```
Available rooms for 2024-12-15T14:00:00Z to 2024-12-15T15:00:00Z:

Conference Room A (room-a@company.com) - Capacity: 10 - Equipment: projector, video_conference
Conference Room B (room-b@company.com) - Capacity: 12 - Equipment: projector, video_conference, whiteboard
```

**Note:** Room finding requires appropriate Microsoft Graph permissions and organizational configuration of room mailboxes.

---

### 4. cancel_meeting

Cancel an existing meeting.

**Input Schema:**
```json
{
  "meetingId": "string (required)"
}
```

**Example:**
```json
{
  "meetingId": "AAMkAGE1M2IyNGNmLTI5MTktNDUyZC1iZWNhLThhNDYxOTc0NTgwNwBGAAAAAADUuTJK1K9TR..."
}
```

**Response:**
```
Meeting AAMkAGE1M2IyNGNmLTI5MTktNDUyZC1iZWNhLThhNDYxOTc0NTgwNwBGAAAAAADUuTJK1K9TR... has been cancelled successfully.
```

---

### 5. update_meeting

Update an existing meeting with new details.

**Input Schema:**
```json
{
  "meetingId": "string (required)",
  "subject": "string (optional)",
  "startDateTime": "string (ISO 8601, optional)",
  "endDateTime": "string (ISO 8601, optional)",
  "attendeeEmails": ["string (email, optional)"]
}
```

**Example:**
```json
{
  "meetingId": "AAMkAGE1M2IyNGNmLTI5MTktNDUyZC1iZWNhLThhNDYxOTc0NTgwNwBGAAAAAADUuTJK1K9TR...",
  "subject": "Updated Project Sync",
  "startDateTime": "2024-12-15T15:00:00Z",
  "endDateTime": "2024-12-15T16:00:00Z"
}
```

**Response:**
```
Meeting AAMkAGE1M2IyNGNmLTI5MTktNDUyZC1iZWNhLThhNDYxOTc0NTgwNwBGAAAAAADUuTJK1K9TR... updated successfully!
Subject: Updated Project Sync
Start: 2024-12-15T15:00:00Z
End: 2024-12-15T16:00:00Z
```

---

### 6. get_my_calendar

Get the current user's calendar events for a specific date range.

**Input Schema:**
```json
{
  "startDateTime": "string (ISO 8601, required)",
  "endDateTime": "string (ISO 8601, required)"
}
```

**Example:**
```json
{
  "startDateTime": "2024-12-15T00:00:00Z",
  "endDateTime": "2024-12-15T23:59:59Z"
}
```

**Response:**
```
Calendar events from 2024-12-15T00:00:00Z to 2024-12-15T23:59:59Z:

Project Sync
  Time: 2024-12-15T14:00:00Z to 2024-12-15T15:00:00Z
  Attendees: john@company.com, jane@company.com
  Location: Conference Room A
  Teams Link: https://teams.microsoft.com/l/meetup-join/...

Team Standup
  Time: 2024-12-15T09:00:00Z to 2024-12-15T09:30:00Z
  Attendees: team@company.com
  Teams Link: https://teams.microsoft.com/l/meetup-join/...
```

---

### 7. resolve_conflicts

Find alternative meeting times when conflicts exist.

**Input Schema:**
```json
{
  "attendeeEmails": ["string (email, required)"],
  "duration": "number (minutes, required)",
  "preferredStartTime": "string (ISO 8601, optional)",
  "timeRange": "string (optional, 'business_hours' or 'all_day')"
}
```

**Example:**
```json
{
  "attendeeEmails": ["john@company.com", "jane@company.com"],
  "duration": 60,
  "preferredStartTime": "2024-12-15T14:00:00Z",
  "timeRange": "business_hours"
}
```

**Response:**
```
Alternative meeting times found:

Option 1: 2024-12-15T10:00:00Z to 2024-12-15T11:00:00Z (Confidence: 95%)
Option 2: 2024-12-15T15:00:00Z to 2024-12-15T16:00:00Z (Confidence: 90%)
Option 3: 2024-12-16T09:00:00Z to 2024-12-16T10:00:00Z (Confidence: 85%)
```

---

## Error Handling

All tools follow a consistent error handling pattern:

**Authentication Error:**
```
❌ Failed to execute [tool name]: Authentication required. Please run the setup command to authenticate with Microsoft Graph.
```

**Permission Error:**
```
❌ Failed to execute [tool name]: Insufficient permissions. Please ensure your account has the required Calendar and Teams permissions.
```

**Not Found Error:**
```
❌ Failed to execute [tool name]: The requested resource was not found. Please check your meeting ID or email addresses.
```

**Validation Error:**
```
❌ Failed to execute [tool name]: Invalid input parameters. [specific validation message]
```

**Network Error:**
```
❌ Failed to execute [tool name]: Network error. Please check your internet connection and try again.
```

---

## Required Permissions

The following Microsoft Graph permissions are required:

| Permission | Type | Reason |
|------------|------|--------|
| `Calendar.ReadWrite` | Delegated | Create, read, update, and delete calendar events |
| `Calendars.Read.Shared` | Delegated | Read shared calendars for availability |
| `Place.Read.All` | Delegated | Read room information |
| `User.Read` | Delegated | Read user profile |

---

## Rate Limits

Microsoft Graph API has the following rate limits:
- **Per-user limit**: 10,000 requests per 10 minutes
- **Per-app limit**: 150,000 requests per 10 minutes

Teams MCP implements automatic retry with exponential backoff for rate-limited requests.

---

## Best Practices

### Date and Time

- Always use ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`
- Times should be in UTC
- Example: `2024-12-15T14:00:00Z`

### Email Addresses

- Must be valid email addresses
- Should be in the same organization or federated organizations
- External attendees may require additional configuration

### Meeting Duration

- Minimum duration: 15 minutes
- Maximum duration: 24 hours
- For all-day events, use `00:00:00Z` to `23:59:59Z`

### Room Booking

- Requires organizational setup of room mailboxes
- Equipment names should match organizational standards
- Capacity filtering helps find appropriate rooms

---

## Examples

### Natural Language to API Mapping

**User Request:** "Schedule a meeting with john@company.com tomorrow at 2 PM"

**API Call:**
```json
{
  "tool": "schedule_meeting",
  "arguments": {
    "subject": "Meeting",
    "attendeeEmails": ["john@company.com"],
    "startDateTime": "2024-12-16T14:00:00Z",
    "endDateTime": "2024-12-16T15:00:00Z",
    "includeTeamsLink": true
  }
}
```

**User Request:** "Find a room for 10 people with a projector tomorrow afternoon"

**API Call:**
```json
{
  "tool": "find_available_rooms",
  "arguments": {
    "startDateTime": "2024-12-16T13:00:00Z",
    "endDateTime": "2024-12-16T17:00:00Z",
    "capacity": 10,
    "equipment": ["projector"]
  }
}
```

---

## Support

For issues or questions:
- [Report Issues](https://github.com/dayour/Teams-MCP/issues)
- [API Discussion](https://github.com/dayour/Teams-MCP/discussions)
