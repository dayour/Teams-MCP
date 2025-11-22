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
 * This class provides an implementation of a Model Context Protocol (MCP) server
 * for managing Microsoft Teams calendar and meeting functionalities. It integrates
 * with Microsoft Graph API to handle scheduling, availability checks, room searches,
 * and other meeting-related operations.
 * 
 * ### Architecture
 * - **Server:** The core MCP server instance that handles communication and tool registration.
 * - **GraphService:** A service for interacting with Microsoft Graph API to perform calendar operations.
 * - **ConflictResolutionService:** A service for resolving scheduling conflicts using data from GraphService.
 * 
 * ### Usage
 * Instantiate the class and call the `run` method to start the server:
 * 
 * ```ts
 * const server = new TeamsMCPServer();
 * server.run().catch(console.error);
 * ```
 * 
 * @class TeamsMCPServer
 * @constructor
 * @property {Server} server - The MCP server instance.
 * @property {GraphService} graphService - Service for interacting with Microsoft Graph API.
 * @property {ConflictResolutionService} conflictService - Service for resolving scheduling conflicts.
 */
/**
 * Microsoft Teams MCP Server
 * Production-ready server with enhanced error handling and logging
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
        description: 'Microsoft Teams integration for AI assistants'
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
    this.setupErrorHandling();
  }

  /**
   * Setup global error handling for the MCP server
   */
  private setupErrorHandling(): void {
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      console.error('Stack:', error.stack);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      // Don't exit in production, just log
    });
  }

  /**
   * Log error with context for better debugging
   */
  private logError(operation: string, error: unknown, context?: any): void {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❌ ${operation} failed:`);
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.stack) {
      console.error(`Stack: ${error.stack}`);
    }
    if (context) {
      console.error(`Context: ${JSON.stringify(context, null, 2)}`);
    }
  }

  /**
   * Log success operations for monitoring
   */
  private logSuccess(operation: string, details?: any): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ✅ ${operation} succeeded`);
    if (details) {
      console.log(`Details: ${JSON.stringify(details, null, 2)}`);
    }
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

    // Handle tool execution with enhanced error handling
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const timestamp = new Date().toISOString();
      
      console.log(`[${timestamp}] 🔧 Executing tool: ${name}`);
      console.log(`[${timestamp}] 📝 Arguments: ${JSON.stringify(args, null, 2)}`);

      try {
        let result;
        switch (name) {
          case 'schedule_meeting':
            result = await this.handleScheduleMeeting(args);
            break;
          case 'check_availability':
            result = await this.handleCheckAvailability(args);
            break;
          case 'find_available_rooms':
            result = await this.handleFindRooms(args);
            break;
          case 'cancel_meeting':
            result = await this.handleCancelMeeting(args);
            break;
          case 'update_meeting':
            result = await this.handleUpdateMeeting(args);
            break;
          case 'get_my_calendar':
            result = await this.handleGetCalendar(args);
            break;
          case 'resolve_conflicts':
            result = await this.handleResolveConflicts(args);
            break;
          default:
            throw new Error(`Unknown tool: ${name}. Available tools: schedule_meeting, check_availability, find_available_rooms, cancel_meeting, update_meeting, get_my_calendar, resolve_conflicts`);
        }
        
        this.logSuccess(`Tool execution: ${name}`);
        return result;
        
      } catch (error) {
        this.logError(`Tool execution: ${name}`, error, { args });
        
        // Return user-friendly error message
        const errorMessage = this.formatUserError(name, error);
        return {
          content: [
            {
              type: 'text',
              text: errorMessage
            }
          ],
          isError: true
        };
      }
    });
  }

  /**
   * Format user-friendly error messages
   */
  private formatUserError(toolName: string, error: unknown): string {
    const baseMessage = `❌ Failed to execute ${toolName.replace('_', ' ')}`;
    
    if (error instanceof Error) {
      // Handle specific error types with user-friendly messages
      if (error.message.includes('authentication') || error.message.includes('401')) {
        return `${baseMessage}: Authentication required. Please run the setup command to authenticate with Microsoft Graph.`;
      }
      
      if (error.message.includes('permission') || error.message.includes('403')) {
        return `${baseMessage}: Insufficient permissions. Please ensure your account has the required Calendar and Teams permissions.`;
      }
      
      if (error.message.includes('not found') || error.message.includes('404')) {
        return `${baseMessage}: The requested resource was not found. Please check your meeting ID or email addresses.`;
      }
      
      if (error.message.includes('validation')) {
        return `${baseMessage}: Invalid input parameters. ${error.message}`;
      }
      
      if (error.message.includes('network') || error.message.includes('timeout')) {
        return `${baseMessage}: Network error. Please check your internet connection and try again.`;
      }
      
      return `${baseMessage}: ${error.message}`;
    }
    
    return `${baseMessage}: An unexpected error occurred. Please try again or contact support.`;
  }

  private async handleScheduleMeeting(args: any) {
    try {
      // Validate input parameters
      const parsed = ScheduleMeetingSchema.parse(args);
      
      console.log(`📅 Scheduling meeting: ${parsed.subject}`);
      console.log(`👥 Attendees: ${parsed.attendeeEmails.join(', ')}`);
      console.log(`⏰ Time: ${parsed.startDateTime} - ${parsed.endDateTime}`);
      
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
            name: email.split('@')[0] // Extract name from email for display
          }
        })),
        location: parsed.location ? {
          displayName: parsed.location
        } : undefined,
        onlineMeeting: parsed.includeTeamsLink ? {
          joinUrl: '' // Will be populated by Graph API
        } : undefined
      };

      const result = await this.graphService.createMeeting(meeting);
      
      const successMessage = [
        `✅ Meeting scheduled successfully!`,
        `📋 Subject: ${result.subject || parsed.subject}`,
        `🆔 Meeting ID: ${result.id}`,
        `⏰ Time: ${new Date(parsed.startDateTime).toLocaleString()} - ${new Date(parsed.endDateTime).toLocaleString()}`,
        `👥 Attendees: ${parsed.attendeeEmails.join(', ')}`,
      ];
      
      if (result.onlineMeeting?.joinUrl) {
        successMessage.push(`🔗 Teams Link: ${result.onlineMeeting.joinUrl}`);
      }
      
      if (parsed.location) {
        successMessage.push(`📍 Location: ${parsed.location}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: successMessage.join('\n')
          }
        ]
      };
      
    } catch (error) {
      // Handle specific scheduling errors
      if (error instanceof Error) {
        if (error.message.includes('conflict')) {
          // Try to detect conflicts
          console.log('🔄 Conflict detected, checking details...');
          try {
            const conflicts = await this.conflictService.detectConflicts({
              startTime: args.startDateTime,
              endTime: args.endDateTime,
              attendees: args.attendeeEmails
            });
            
            if (conflicts.length > 0) {
              const conflictDetails = conflicts.map(c => 
                `• ${c.attendee}: ${c.type} at ${c.time} (${c.details})`
              ).join('\n');
              
              return {
                content: [
                  {
                    type: 'text',
                    text: `⚠️ Scheduling conflict detected!\n\n` +
                          `Conflicts:\n${conflictDetails}\n\n` +
                          `💡 Please try a different time slot or check with the attendees for their availability.`
                  }
                ]
              };
            }
          } catch (conflictError) {
            console.error('Failed to analyze conflicts:', conflictError);
          }
        }
      }
      
      throw error; // Re-throw to be handled by main error handler
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