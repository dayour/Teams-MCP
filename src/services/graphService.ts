import { Client } from '@microsoft/microsoft-graph-client';
import { AuthProvider } from '@microsoft/microsoft-graph-client';
import { DeviceAuthHelper } from '../auth-helper.js';

export interface Meeting {
    id?: string;
    subject: string;
    start: {
        dateTime: string;
        timeZone: string;
    };
    end: {
        dateTime: string;
        timeZone: string;
    };
    attendees: Array<{
        emailAddress: {
            address: string;
            name: string;
        };
    }>;
    location?: {
        displayName: string;
        locationType?: string;
    };
    onlineMeeting?: {
        joinUrl: string;
    };
}

export interface Room {
    id: string;
    displayName: string;
    emailAddress: string;
    capacity?: number;
    equipment?: string[];
    isAvailable: boolean;
}

export interface Availability {
    email: string;
    freeBusyStatus: 'free' | 'busy' | 'tentative' | 'outOfOffice';
    start: string;
    end: string;
}

/**
 * Custom Auth Provider for device authentication
 */
class DeviceAuthProvider {
    private authHelper: DeviceAuthHelper;

    constructor() {
        this.authHelper = new DeviceAuthHelper();
    }

    async getAccessToken(): Promise<string> {
        let token = await this.authHelper.getStoredToken();
        
        if (!token) {
            console.error('No valid authentication found. Please run authentication first.');
            token = await this.authHelper.authenticate();
        }
        
        return token;
    }
}

/**
 * Service for interacting with Microsoft Graph API for calendar and meeting operations
 */
export class GraphService {
    private graphClient: Client | null = null;
    private useDeviceAuth: boolean;
    private isInitialized: boolean = false;

    constructor(useDeviceAuth: boolean = true) {
        this.useDeviceAuth = useDeviceAuth;
        // Don't initialize immediately - do it lazily when needed
    }

    /**
     * Ensure Graph client is initialized
     */
    private async ensureInitialized(): Promise<void> {
        if (this.isInitialized) {
            return;
        }
        
        this.initializeGraphClient();
        this.isInitialized = true;
    }

    /**
     * Initialize Microsoft Graph client
     */
    private initializeGraphClient(): void {
        try {
            if (this.useDeviceAuth) {
                // Use device authentication with custom auth provider
                const authProvider = new DeviceAuthProvider();
                
                // Create a proper authentication provider
                const customAuthProvider = {
                    getAccessToken: async () => {
                        return await authProvider.getAccessToken();
                    }
                };
                
                this.graphClient = Client.initWithMiddleware({
                    authProvider: customAuthProvider as any
                });
            } else {
                // Use app registration credentials from environment
                const clientId = process.env.CLIENT_ID;
                const clientSecret = process.env.CLIENT_SECRET;
                const tenantId = process.env.TENANT_ID;

                if (!clientId || !clientSecret || !tenantId) {
                    throw new Error('Missing Azure app registration credentials');
                }

                // TODO: Implement client credentials flow for app registration
                console.log('App registration authentication not yet implemented');
            }
        } catch (error) {
            console.error('Failed to initialize Graph client:', error);
        }
    }

    /**
     * Get user's calendar availability for the next few days
     */
    async getUserAvailability(userId?: string): Promise<Availability[]> {
        await this.ensureInitialized();
        try {
            // Mock data for now - replace with actual Graph API call
            return [
                {
                    email: 'user@company.com',
                    freeBusyStatus: 'free',
                    start: new Date().toISOString(),
                    end: new Date(Date.now() + 60 * 60 * 1000).toISOString()
                }
            ];
        } catch (error) {
            console.error('Error getting user availability:', error);
            throw error;
        }
    }

    /**
     * Get available meeting rooms
     */
    async getAvailableRooms(): Promise<Room[]> {
        try {
            // Mock data for now - replace with actual Graph API call
            return [
                {
                    id: 'room1',
                    displayName: 'Conference Room A',
                    emailAddress: 'room-a@company.com',
                    capacity: 10,
                    equipment: ['projector', 'whiteboard', 'video_conference'],
                    isAvailable: true
                },
                {
                    id: 'room2',
                    displayName: 'Conference Room B',
                    emailAddress: 'room-b@company.com',
                    capacity: 6,
                    equipment: ['whiteboard', 'video_conference'],
                    isAvailable: true
                },
                {
                    id: 'room3',
                    displayName: 'Meeting Room C',
                    emailAddress: 'room-c@company.com',
                    capacity: 4,
                    equipment: ['whiteboard'],
                    isAvailable: false
                }
            ];
        } catch (error) {
            console.error('Error getting available rooms:', error);
            throw error;
        }
    }

    /**
     * Create a new meeting
     */
    async createMeeting(meetingData: any): Promise<Meeting> {
        await this.ensureInitialized();
        try {
            // Mock meeting creation - replace with actual Graph API call
            const meeting: Meeting = {
                id: 'meeting_' + Date.now(),
                subject: meetingData.subject || 'New Meeting',
                start: {
                    dateTime: meetingData.startTime || new Date().toISOString(),
                    timeZone: 'UTC'
                },
                end: {
                    dateTime: meetingData.endTime || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                    timeZone: 'UTC'
                },
                attendees: meetingData.attendees || [],
                location: meetingData.location,
                onlineMeeting: {
                    joinUrl: 'https://teams.microsoft.com/l/meetup-join/...'
                }
            };

            console.log('Created meeting:', meeting);
            return meeting;
        } catch (error) {
            console.error('Error creating meeting:', error);
            throw error;
        }
    }

    /**
     * Get room details by ID
     */
    async getRoomDetails(roomId: string): Promise<Room> {
        try {
            const rooms = await this.getAvailableRooms();
            const room = rooms.find(r => r.id === roomId);
            
            if (!room) {
                throw new Error(`Room with ID ${roomId} not found`);
            }

            return room;
        } catch (error) {
            console.error('Error getting room details:', error);
            throw error;
        }
    }

    /**
     * Check availability for specific time slots
     */
    async checkTimeSlotAvailability(timeSlotData: any): Promise<Availability[]> {
        try {
            // Mock availability check - replace with actual Graph API call
            return [
                {
                    email: timeSlotData.attendee || 'user@company.com',
                    freeBusyStatus: 'free',
                    start: timeSlotData.startTime,
                    end: timeSlotData.endTime
                }
            ];
        } catch (error) {
            console.error('Error checking time slot availability:', error);
            throw error;
        }
    }

    /**
     * Get user's calendar events for conflict detection
     */
    async getCalendarEvents(startTime: string, endTime: string, userId?: string): Promise<Meeting[]> {
        try {
            // Mock calendar events - replace with actual Graph API call
            return [];
        } catch (error) {
            console.error('Error getting calendar events:', error);
            throw error;
        }
    }

    /**
     * Check availability of attendees
     */
    async checkAvailability(attendeeEmails: string[], startTime: string, endTime: string): Promise<Availability[]> {
        try {
            // Mock availability check - replace with actual Graph API call
            return attendeeEmails.map(email => ({
                email,
                freeBusyStatus: 'free' as const,
                start: startTime,
                end: endTime
            }));
        } catch (error) {
            console.error('Error checking availability:', error);
            throw error;
        }
    }

    /**
     * Find available rooms
     */
    async findAvailableRooms(startTime: string, endTime: string, capacity?: number, equipment?: string[]): Promise<Room[]> {
        try {
            // Mock room finding - replace with actual Graph API call
            return [
                {
                    id: 'room1',
                    displayName: 'Conference Room A',
                    emailAddress: 'room-a@company.com',
                    capacity: 10,
                    equipment: ['projector', 'whiteboard'],
                    isAvailable: true
                }
            ];
        } catch (error) {
            console.error('Error finding rooms:', error);
            throw error;
        }
    }

    /**
     * Update an existing meeting
     */
    async updateMeeting(meetingId: string, updates: Partial<Meeting>): Promise<Meeting> {
        try {
            // Mock meeting update - replace with actual Graph API call
            console.log(`Updating meeting ${meetingId} with:`, updates);
            
            // Return updated meeting
            return {
                id: meetingId,
                subject: updates.subject || 'Updated Meeting',
                start: updates.start || { dateTime: new Date().toISOString(), timeZone: 'UTC' },
                end: updates.end || { dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), timeZone: 'UTC' },
                attendees: updates.attendees || []
            };
        } catch (error) {
            console.error('Error updating meeting:', error);
            throw error;
        }
    }

    /**
     * Cancel a meeting
     */
    async cancelMeeting(meetingId: string): Promise<void> {
        try {
            // Mock meeting cancellation - replace with actual Graph API call
            console.log(`Cancelling meeting ${meetingId}`);
        } catch (error) {
            console.error('Error cancelling meeting:', error);
            throw error;
        }
    }
}
