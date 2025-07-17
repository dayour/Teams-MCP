#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { GraphService, Meeting, Room } from './services/graphService.js';
import { ConflictResolutionService, TimeSlot } from './services/conflictResolutionService.js';
import { z } from 'zod';

// Define schemas for tool arguments
const ScheduleMeetingSchema = z.object({
  subject: z.string().describe("Meeting subject/title"),
  attendeeEmails: z.array(z.string().email()).describe("Email addresses of attendees"),
  startDateTime: z.string().describe("Start date and time in ISO format"),
  endDateTime: z.string().describe("End date and time in ISO format"),
  location: z.string().optional().describe("Meeting location or room"),
  includeTeamsLink: z.boolean().default(true).describe("Whether to include Teams meeting link"),
});

const CheckAvailabilitySchema = z.object({
  attendeeEmails: z.array(z.string().email()).describe("Email addresses to check availability for"),
  startDateTime: z.string().describe("Start of time range to check"),
  endDateTime: z.string().describe("End of time range to check"),
});

const FindRoomsSchema = z.object({
  startDateTime: z.string().describe("Meeting start time"),
  endDateTime: z.string().describe("Meeting end time"),
  capacity: z.number().optional().describe("Required room capacity"),
  equipment: z.array(z.string()).optional().describe("Required equipment"),
});

const CancelMeetingSchema = z.object({
  meetingId: z.string().describe("ID of the meeting to cancel"),
});

const UpdateMeetingSchema = z.object({
  meetingId: z.string().describe("ID of the meeting to update"),
  subject: z.string().optional().describe("New meeting subject"),
  startDateTime: z.string().optional().describe("New start date and time"),
  endDateTime: z.string().optional().describe("New end date and time"),
  attendeeEmails: z.array(z.string().email()).optional().describe("New attendee list"),
});

/**
 * Microsoft Teams MCP Server
 * 
 * Provides Teams calendar and meeting management capabilities via MCP
 */
class TeamsMCPServer {
  private server: Server;
  private graphService: GraphService;
  private conflictService: ConflictResolutionService;

  constructor() {
    this.server = new Server(
      {
        name: 'teams-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.graphService = new GraphService(true); // Use device auth by default
    this.conflictService = new ConflictResolutionService(this.graphService);

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // Define available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'schedule_meeting',
            description: 'Schedule a new meeting in Microsoft Teams with attendees and optional room booking',
            inputSchema: {
              type: 'object',
              properties: {
                subject: { type: 'string', description: 'Meeting subject/title' },
                attendeeEmails: { 
                  type: 'array', 
                  items: { type: 'string', format: 'email' },
                  description: 'Email addresses of attendees' 
                },
                startDateTime: { type: 'string', description: 'Start date and time in ISO format' },
                endDateTime: { type: 'string', description: 'End date and time in ISO format' },
                location: { type: 'string', description: 'Meeting location or room' },
                includeTeamsLink: { type: 'boolean', description: 'Whether to include Teams meeting link', default: true }
              },
              required: ['subject', 'attendeeEmails', 'startDateTime', 'endDateTime']
            }
          },
          {
            name: 'check_availability',
            description: 'Check availability of attendees for a specific time range',
            inputSchema: {
              type: 'object',
              properties: {
                attendeeEmails: { 
                  type: 'array', 
                  items: { type: 'string', format: 'email' },
                  description: 'Email addresses to check availability for' 
                },
                startDateTime: { type: 'string', description: 'Start of time range to check' },
                endDateTime: { type: 'string', description: 'End of time range to check' }
              },
              required: ['attendeeEmails', 'startDateTime', 'endDateTime']
            }
          },
          {
            name: 'find_available_rooms',
            description: 'Find available meeting rooms for a specific time and capacity',
            inputSchema: {
              type: 'object',
              properties: {
                startDateTime: { type: 'string', description: 'Meeting start time' },
                endDateTime: { type: 'string', description: 'Meeting end time' },
                capacity: { type: 'number', description: 'Required room capacity' },
                equipment: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'Required equipment' 
                }
              },
              required: ['startDateTime', 'endDateTime']
            }
          },
          {
            name: 'cancel_meeting',
            description: 'Cancel an existing meeting',
            inputSchema: {
              type: 'object',
              properties: {
                meetingId: { type: 'string', description: 'ID of the meeting to cancel' }
              },
              required: ['meetingId']
            }
          },
          {
            name: 'update_meeting',
            description: 'Update an existing meeting with new details',
            inputSchema: {
              type: 'object',
              properties: {
                meetingId: { type: 'string', description: 'ID of the meeting to update' },
                subject: { type: 'string', description: 'New meeting subject' },
                startDateTime: { type: 'string', description: 'New start date and time' },
                endDateTime: { type: 'string', description: 'New end date and time' },
                attendeeEmails: { 
                  type: 'array', 
                  items: { type: 'string', format: 'email' },
                  description: 'New attendee list' 
                }
              },
              required: ['meetingId']
            }
          },
          {
            name: 'get_my_calendar',
            description: 'Get current user\'s calendar events for a specific date range',
            inputSchema: {
              type: 'object',
              properties: {
                startDateTime: { type: 'string', description: 'Start date to fetch events from' },
                endDateTime: { type: 'string', description: 'End date to fetch events until' }
              },
              required: ['startDateTime', 'endDateTime']
            }
          },
          {
            name: 'resolve_conflicts',
            description: 'Find alternative meeting times when conflicts exist',
            inputSchema: {
              type: 'object',
              properties: {
                attendeeEmails: { 
                  type: 'array', 
                  items: { type: 'string', format: 'email' },
                  description: 'Attendee email addresses' 
                },
                duration: { type: 'number', description: 'Meeting duration in minutes' },
                preferredStartTime: { type: 'string', description: 'Preferred start time' },
                timeRange: { type: 'string', description: 'Time range to search within (e.g., "business_hours", "all_day")' }
              },
              required: ['attendeeEmails', 'duration']
            }
          }
        ]
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'schedule_meeting':
            return await this.handleScheduleMeeting(args);
          case 'check_availability':
            return await this.handleCheckAvailability(args);
          case 'find_available_rooms':
            return await this.handleFindRooms(args);
          case 'cancel_meeting':
            return await this.handleCancelMeeting(args);
          case 'update_meeting':
            return await this.handleUpdateMeeting(args);
          case 'get_my_calendar':
            return await this.handleGetCalendar(args);
          case 'resolve_conflicts':
            return await this.handleResolveConflicts(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    });
  }

  private async handleScheduleMeeting(args: any) {
    const parsed = ScheduleMeetingSchema.parse(args);
    
    try {
      const meeting: Meeting = {
        subject: parsed.subject,
        start: {
          dateTime: parsed.startDateTime,
          timeZone: 'UTC'
        },
        end: {
          dateTime: parsed.endDateTime,
          timeZone: 'UTC'
        },
        attendees: parsed.attendeeEmails.map(email => ({
          emailAddress: {
            address: email,
            name: email.split('@')[0]
          }
        })),
        location: parsed.location ? {
          displayName: parsed.location
        } : undefined
      };

      const result = await this.graphService.createMeeting(meeting);
      
      return {
        content: [
          {
            type: 'text',
            text: `Meeting "${parsed.subject}" scheduled successfully!\n` +
                  `Meeting ID: ${result.id}\n` +
                  `Start: ${parsed.startDateTime}\n` +
                  `End: ${parsed.endDateTime}\n` +
                  `Attendees: ${parsed.attendeeEmails.join(', ')}\n` +
                  (parsed.location ? `Location: ${parsed.location}\n` : '') +
                  (result.onlineMeeting?.joinUrl ? `Teams Link: ${result.onlineMeeting.joinUrl}` : '')
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to schedule meeting: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async handleCheckAvailability(args: any) {
    const parsed = CheckAvailabilitySchema.parse(args);
    
    try {
      const availability = await this.graphService.checkAvailability(
        parsed.attendeeEmails,
        parsed.startDateTime,
        parsed.endDateTime
      );

      const availabilityText = availability.map((avail: any) => 
        `${avail.email}: ${avail.freeBusyStatus} (${avail.start} - ${avail.end})`
      ).join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `Availability for ${parsed.startDateTime} to ${parsed.endDateTime}:\n\n${availabilityText}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to check availability: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async handleFindRooms(args: any) {
    const parsed = FindRoomsSchema.parse(args);
    
    try {
      const rooms = await this.graphService.findAvailableRooms(
        parsed.startDateTime,
        parsed.endDateTime,
        parsed.capacity,
        parsed.equipment
      );

      if (rooms.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No available rooms found for the specified criteria.'
            }
          ]
        };
      }

      const roomsText = rooms.map((room: any) => 
        `${room.displayName} (${room.emailAddress})` +
        (room.capacity ? ` - Capacity: ${room.capacity}` : '') +
        (room.equipment?.length ? ` - Equipment: ${room.equipment.join(', ')}` : '')
      ).join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `Available rooms for ${parsed.startDateTime} to ${parsed.endDateTime}:\n\n${roomsText}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to find rooms: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async handleCancelMeeting(args: any) {
    const parsed = CancelMeetingSchema.parse(args);
    
    try {
      await this.graphService.cancelMeeting(parsed.meetingId);
      
      return {
        content: [
          {
            type: 'text',
            text: `Meeting ${parsed.meetingId} has been cancelled successfully.`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to cancel meeting: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async handleUpdateMeeting(args: any) {
    const parsed = UpdateMeetingSchema.parse(args);
    
    try {
      const updates: Partial<Meeting> = {};
      
      if (parsed.subject) updates.subject = parsed.subject;
      if (parsed.startDateTime) {
        updates.start = { dateTime: parsed.startDateTime, timeZone: 'UTC' };
      }
      if (parsed.endDateTime) {
        updates.end = { dateTime: parsed.endDateTime, timeZone: 'UTC' };
      }
      if (parsed.attendeeEmails) {
        updates.attendees = parsed.attendeeEmails.map(email => ({
          emailAddress: { address: email, name: email.split('@')[0] }
        }));
      }

      const result = await this.graphService.updateMeeting(parsed.meetingId, updates);
      
      return {
        content: [
          {
            type: 'text',
            text: `Meeting ${parsed.meetingId} updated successfully!\n` +
                  `Subject: ${result.subject}\n` +
                  `Start: ${result.start.dateTime}\n` +
                  `End: ${result.end.dateTime}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to update meeting: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async handleGetCalendar(args: any) {
    try {
      const events = await this.graphService.getCalendarEvents(args.startDateTime, args.endDateTime);
      
      if (events.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No events found between ${args.startDateTime} and ${args.endDateTime}.`
            }
          ]
        };
      }

      const eventsText = events.map(event => 
        `${event.subject}\n` +
        `  Time: ${event.start.dateTime} to ${event.end.dateTime}\n` +
        `  Attendees: ${event.attendees.map(a => a.emailAddress.address).join(', ')}\n` +
        (event.location ? `  Location: ${event.location.displayName}\n` : '') +
        (event.onlineMeeting?.joinUrl ? `  Teams Link: ${event.onlineMeeting.joinUrl}\n` : '')
      ).join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `Calendar events from ${args.startDateTime} to ${args.endDateTime}:\n\n${eventsText}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to get calendar: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async handleResolveConflicts(args: any) {
    try {
      const suggestions: TimeSlot[] = await this.conflictService.findAlternativeTimeSlots({
        attendees: args.attendeeEmails.map((email: string) => ({ email })),
        duration: args.duration,
        preferredStart: args.preferredStartTime,
        timeRange: args.timeRange || 'business_hours'
      });

      if (suggestions.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No alternative time slots found that work for all attendees.'
            }
          ]
        };
      }

      const suggestionsText = suggestions.map((slot: TimeSlot, index: number) => 
        `Option ${index + 1}: ${slot.startTime} to ${slot.endTime}` +
        (slot.confidence ? ` (Confidence: ${Math.round(slot.confidence * 100)}%)` : '')
      ).join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `Alternative meeting times found:\n\n${suggestionsText}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to resolve conflicts: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Teams MCP Server running on stdio');
  }
}

// Start the server
if (require.main === module) {
  const server = new TeamsMCPServer();
  server.run().catch(console.error);
}

export { TeamsMCPServer };