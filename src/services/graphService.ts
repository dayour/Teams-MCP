import { Client } from '@microsoft/microsoft-graph-client';
import { AuthProvider } from '@microsoft/microsoft-graph-client';
import { DeviceAuthHelper } from '../auth-helper.js';
import { log } from '../utils/logger.js';

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
     * Get user's calendar availability for the next few days using Microsoft Graph API
     */
    async getUserAvailability(userId?: string): Promise<Availability[]> {
        await this.ensureInitialized();
        
        if (!this.graphClient) {
            throw new Error('Graph client not initialized');
        }
        
        try {
            const startTime = new Date().toISOString();
            const endTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Next 7 days
            
            const scheduleId = userId || 'me';
            const request = {
                schedules: [{ scheduleId: scheduleId, scheduleType: 'user' }],
                startTime: { dateTime: startTime, timeZone: 'UTC' },
                endTime: { dateTime: endTime, timeZone: 'UTC' },
                availabilityViewInterval: 60
            };

            const response = await this.graphClient
                .api('/me/calendar/getSchedule')
                .post(request);

            const schedule = response.value[0];
            return [{
                email: schedule.scheduleId,
                freeBusyStatus: this.parseFreebusy(schedule.availabilityView || ''),
                start: startTime,
                end: endTime
            }];
        } catch (error) {
            console.error('Error getting user availability:', error);
            throw new Error(`Failed to get user availability: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get available meeting rooms using Microsoft Graph API
     */
    async getAvailableRooms(): Promise<Room[]> {
        await this.ensureInitialized();
        
        if (!this.graphClient) {
            throw new Error('Graph client not initialized');
        }
        
        try {
            const response = await this.graphClient
                .api('/places/microsoft.graph.room')
                .get();

            return response.value.map((place: any) => ({
                id: place.id,
                displayName: place.displayName,
                emailAddress: place.emailAddress,
                capacity: place.capacity,
                equipment: place.equipment || [],
                isAvailable: true // Default to true, check availability separately with specific times
            }));
        } catch (error) {
            console.error('Error getting available rooms:', error);
            console.warn('Note: Room listing requires appropriate Microsoft Graph permissions and organizational configuration');
            return [];
        }
    }

    /**
     * Create a new meeting using Microsoft Graph API
     */
    async createMeeting(meetingData: any): Promise<Meeting> {
        await this.ensureInitialized();
        
        if (!this.graphClient) {
            throw new Error('Graph client not initialized');
        }
        
        const startTime = Date.now();
        
        try {
            const event = {
                subject: meetingData.subject,
                start: meetingData.start,
                end: meetingData.end,
                attendees: meetingData.attendees,
                location: meetingData.location,
                isOnlineMeeting: meetingData.onlineMeeting !== undefined,
                onlineMeetingProvider: meetingData.onlineMeeting ? 'teamsForBusiness' : undefined
            };

            const response = await this.graphClient
                .api('/me/events')
                .post(event);

            const duration = Date.now() - startTime;
            log.graphAPI('/me/events', 'POST', true, duration);
            log.info('Created meeting via Graph API', { meetingId: response.id });
            
            return {
                id: response.id,
                subject: response.subject,
                start: response.start,
                end: response.end,
                attendees: response.attendees || [],
                location: response.location,
                onlineMeeting: response.onlineMeeting ? { joinUrl: response.onlineMeeting.joinUrl } : undefined
            };
        } catch (error) {
            const duration = Date.now() - startTime;
            log.graphAPI('/me/events', 'POST', false, duration);
            log.error('Error creating meeting', error);
            throw new Error(`Failed to create meeting: ${error instanceof Error ? error.message : String(error)}`);
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
     * Check availability for specific time slots using Microsoft Graph API
     */
    async checkTimeSlotAvailability(timeSlotData: any): Promise<Availability[]> {
        await this.ensureInitialized();
        
        if (!this.graphClient) {
            throw new Error('Graph client not initialized');
        }
        
        try {
            const attendeeEmail = timeSlotData.attendee || 'me';
            
            const request = {
                schedules: [{ scheduleId: attendeeEmail, scheduleType: 'user' }],
                startTime: { dateTime: timeSlotData.startTime, timeZone: 'UTC' },
                endTime: { dateTime: timeSlotData.endTime, timeZone: 'UTC' },
                availabilityViewInterval: 30
            };

            const response = await this.graphClient
                .api('/me/calendar/getSchedule')
                .post(request);

            const schedule = response.value[0];
            return [{
                email: attendeeEmail,
                freeBusyStatus: this.parseFreebusy(schedule.availabilityView || ''),
                start: timeSlotData.startTime,
                end: timeSlotData.endTime
            }];
        } catch (error) {
            console.error('Error checking time slot availability:', error);
            throw new Error(`Failed to check time slot availability: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get user's calendar events for conflict detection using Microsoft Graph API
     */
    async getCalendarEvents(startTime: string, endTime: string, userId?: string): Promise<Meeting[]> {
        await this.ensureInitialized();
        
        if (!this.graphClient) {
            throw new Error('Graph client not initialized');
        }
        
        try {
            const endpoint = userId ? `/users/${userId}/calendar/calendarView` : '/me/calendar/calendarView';
            
            const response = await this.graphClient
                .api(endpoint)
                .query({
                    startDateTime: startTime,
                    endDateTime: endTime
                })
                .select('id,subject,start,end,attendees,location,onlineMeeting')
                .get();

            return response.value.map((event: any) => ({
                id: event.id,
                subject: event.subject,
                start: event.start,
                end: event.end,
                attendees: event.attendees || [],
                location: event.location,
                onlineMeeting: event.onlineMeeting ? { joinUrl: event.onlineMeeting.joinUrl } : undefined
            }));
        } catch (error) {
            console.error('Error getting calendar events:', error);
            throw new Error(`Failed to get calendar events: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Check availability of attendees using Microsoft Graph API
     */
    async checkAvailability(attendeeEmails: string[], startTime: string, endTime: string): Promise<Availability[]> {
        await this.ensureInitialized();
        
        if (!this.graphClient) {
            throw new Error('Graph client not initialized');
        }
        
        try {
            const schedules = attendeeEmails.map(email => ({ scheduleId: email, scheduleType: 'user' }));
            
            const request = {
                schedules: schedules,
                startTime: { dateTime: startTime, timeZone: 'UTC' },
                endTime: { dateTime: endTime, timeZone: 'UTC' },
                availabilityViewInterval: 60
            };

            const response = await this.graphClient
                .api('/me/calendar/getSchedule')
                .post(request);

            return response.value.map((schedule: any) => ({
                email: schedule.scheduleId,
                freeBusyStatus: schedule.availabilityView ? this.parseFreebusy(schedule.availabilityView) : 'free',
                start: startTime,
                end: endTime
            }));
        } catch (error) {
            console.error('Error checking availability:', error);
            throw new Error(`Failed to check availability: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Parse freebusy availability view
     * 0 = free, 1 = tentative, 2 = busy, 3 = out of office, 4 = working elsewhere
     */
    private parseFreebusy(availabilityView: string): 'free' | 'busy' | 'tentative' | 'outOfOffice' {
        if (availabilityView.includes('2') || availabilityView.includes('3')) {
            return 'busy';
        } else if (availabilityView.includes('1')) {
            return 'tentative';
        } else if (availabilityView.includes('3')) {
            return 'outOfOffice';
        }
        return 'free';
    }

    /**
     * Find available rooms using Microsoft Graph API
     */
    async findAvailableRooms(startTime: string, endTime: string, capacity?: number, equipment?: string[]): Promise<Room[]> {
        await this.ensureInitialized();
        
        if (!this.graphClient) {
            throw new Error('Graph client not initialized');
        }
        
        try {
            // First, get all rooms/places
            const placesResponse = await this.graphClient
                .api('/places/microsoft.graph.room')
                .get();

            const rooms: Room[] = placesResponse.value.map((place: any) => ({
                id: place.id,
                displayName: place.displayName,
                emailAddress: place.emailAddress,
                capacity: place.capacity,
                equipment: place.equipment || [],
                isAvailable: true // Will be updated by schedule check
            }));

            // Filter by capacity if specified
            let filteredRooms = rooms;
            if (capacity) {
                filteredRooms = rooms.filter(room => room.capacity && room.capacity >= capacity);
            }

            // Filter by equipment if specified
            if (equipment && equipment.length > 0) {
                filteredRooms = filteredRooms.filter(room => 
                    equipment.every(eq => room.equipment?.includes(eq))
                );
            }

            // Check availability using getSchedule
            if (filteredRooms.length > 0) {
                const scheduleRequest = {
                    schedules: filteredRooms.map(room => ({ scheduleId: room.emailAddress, scheduleType: 'room' })),
                    startTime: { dateTime: startTime, timeZone: 'UTC' },
                    endTime: { dateTime: endTime, timeZone: 'UTC' },
                    availabilityViewInterval: 60
                };

                const scheduleResponse = await this.graphClient
                    .api('/me/calendar/getSchedule')
                    .post(scheduleRequest);

                // Update availability based on schedule
                scheduleResponse.value.forEach((schedule: any) => {
                    const room = filteredRooms.find(r => r.emailAddress === schedule.scheduleId);
                    if (room) {
                        // If availabilityView contains any non-zero, room is not available
                        room.isAvailable = !schedule.availabilityView || schedule.availabilityView === '0'.repeat(schedule.availabilityView.length);
                    }
                });
            }

            return filteredRooms.filter(room => room.isAvailable);
        } catch (error) {
            console.error('Error finding rooms:', error);
            // If places API is not available, return empty array instead of throwing
            console.warn('Note: Room finding requires appropriate Microsoft Graph permissions and organizational configuration');
            return [];
        }
    }

    /**
     * Update an existing meeting using Microsoft Graph API
     */
    async updateMeeting(meetingId: string, updates: Partial<Meeting>): Promise<Meeting> {
        await this.ensureInitialized();
        
        if (!this.graphClient) {
            throw new Error('Graph client not initialized');
        }
        
        try {
            console.log(`Updating meeting ${meetingId} with:`, updates);
            
            const response = await this.graphClient
                .api(`/me/events/${meetingId}`)
                .patch(updates);

            return {
                id: response.id,
                subject: response.subject,
                start: response.start,
                end: response.end,
                attendees: response.attendees || [],
                location: response.location,
                onlineMeeting: response.onlineMeeting ? { joinUrl: response.onlineMeeting.joinUrl } : undefined
            };
        } catch (error) {
            console.error('Error updating meeting:', error);
            throw new Error(`Failed to update meeting: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Cancel a meeting using Microsoft Graph API
     */
    async cancelMeeting(meetingId: string): Promise<void> {
        await this.ensureInitialized();
        
        if (!this.graphClient) {
            throw new Error('Graph client not initialized');
        }
        
        try {
            console.log(`Cancelling meeting ${meetingId}`);
            
            await this.graphClient
                .api(`/me/events/${meetingId}`)
                .delete();
                
            console.log(`Meeting ${meetingId} cancelled successfully`);
        } catch (error) {
            console.error('Error cancelling meeting:', error);
            throw new Error(`Failed to cancel meeting: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
