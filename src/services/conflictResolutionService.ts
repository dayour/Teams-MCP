import { GraphService, Meeting } from './graphService';

export interface Conflict {
    attendee: string;
    type: 'meeting' | 'appointment' | 'busy';
    time: string;
    details: string;
}

export interface ConflictResolution {
    type: 'reschedule' | 'alternative' | 'force';
    newTime?: string;
    alternatives?: string[];
    message: string;
}

/**
 * Service for detecting and resolving scheduling conflicts
 */
export class ConflictResolutionService {
    private graphService: GraphService;

    constructor(graphService: GraphService) {
        this.graphService = graphService;
    }

    /**
     * Detect conflicts for a proposed meeting time
     */
    async detectConflicts(meetingData: any): Promise<Conflict[]> {
        try {
            const conflicts: Conflict[] = [];
            const { startTime, endTime, attendees } = meetingData;

            if (!attendees || !Array.isArray(attendees)) {
                return conflicts;
            }

            // Check each attendee's availability
            for (const attendee of attendees) {
                const attendeeConflicts = await this.checkAttendeeConflicts(
                    attendee, 
                    startTime, 
                    endTime
                );
                conflicts.push(...attendeeConflicts);
            }

            return conflicts;
        } catch (error) {
            console.error('Error detecting conflicts:', error);
            return [];
        }
    }

    /**
     * Check conflicts for a specific attendee
     */
    private async checkAttendeeConflicts(
        attendee: string, 
        startTime: string, 
        endTime: string
    ): Promise<Conflict[]> {
        try {
            const conflicts: Conflict[] = [];
            
            // Get attendee's calendar events during the proposed time
            const calendarEvents = await this.graphService.getCalendarEvents(
                attendee, 
                startTime, 
                endTime
            );

            // Check for overlapping meetings
            for (const event of calendarEvents) {
                if (this.hasTimeOverlap(startTime, endTime, event.start.dateTime, event.end.dateTime)) {
                    conflicts.push({
                        attendee,
                        type: 'meeting',
                        time: `${new Date(event.start.dateTime).toLocaleString()} - ${new Date(event.end.dateTime).toLocaleString()}`,
                        details: event.subject
                    });
                }
            }

            // Get free/busy information
            const availability = await this.graphService.checkTimeSlotAvailability({
                attendee,
                startTime,
                endTime
            });

            // Check if attendee is busy during the time slot
            for (const slot of availability) {
                if (slot.freeBusyStatus !== 'free') {
                    conflicts.push({
                        attendee,
                        type: 'busy',
                        time: `${new Date(slot.start).toLocaleString()} - ${new Date(slot.end).toLocaleString()}`,
                        details: `Status: ${slot.freeBusyStatus}`
                    });
                }
            }

            return conflicts;
        } catch (error) {
            console.error(`Error checking conflicts for ${attendee}:`, error);
            return [];
        }
    }

    /**
     * Check if two time ranges overlap
     */
    private hasTimeOverlap(
        start1: string, 
        end1: string, 
        start2: string, 
        end2: string
    ): boolean {
        const startTime1 = new Date(start1);
        const endTime1 = new Date(end1);
        const startTime2 = new Date(start2);
        const endTime2 = new Date(end2);

        return startTime1 < endTime2 && startTime2 < endTime1;
    }

    /**
     * Resolve conflicts by suggesting alternatives
     */
    async resolveConflict(conflictData: any): Promise<ConflictResolution> {
        try {
            const { resolution, originalData } = conflictData;

            switch (resolution) {
                case 'move1hour':
                    return await this.rescheduleByOffset(originalData, 60); // 1 hour

                case 'tomorrow':
                    return await this.rescheduleToNextDay(originalData);

                case 'findAlternative':
                    return await this.findAlternativeTimeSlots(originalData);

                default:
                    return {
                        type: 'force',
                        message: 'Meeting will be scheduled despite conflicts'
                    };
            }
        } catch (error) {
            console.error('Error resolving conflict:', error);
            return {
                type: 'force',
                message: 'Unable to resolve conflicts automatically'
            };
        }
    }

    /**
     * Reschedule meeting by a time offset
     */
    private async rescheduleByOffset(originalData: any, offsetMinutes: number): Promise<ConflictResolution> {
        const originalStart = new Date(originalData.startTime);
        const originalEnd = new Date(originalData.endTime);
        
        const newStart = new Date(originalStart.getTime() + offsetMinutes * 60 * 1000);
        const newEnd = new Date(originalEnd.getTime() + offsetMinutes * 60 * 1000);

        // Check if the new time has conflicts
        const newConflicts = await this.detectConflicts({
            ...originalData,
            startTime: newStart.toISOString(),
            endTime: newEnd.toISOString()
        });

        if (newConflicts.length === 0) {
            return {
                type: 'reschedule',
                newTime: `${newStart.toLocaleString()} - ${newEnd.toLocaleString()}`,
                message: `Successfully rescheduled to ${newStart.toLocaleString()}`
            };
        } else {
            return {
                type: 'alternative',
                message: 'The suggested time also has conflicts. Please try a different time.',
                alternatives: [
                    `${new Date(newStart.getTime() + 60 * 60 * 1000).toLocaleString()}`,
                    `${new Date(newStart.getTime() + 120 * 60 * 1000).toLocaleString()}`
                ]
            };
        }
    }

    /**
     * Reschedule meeting to the next day at the same time
     */
    private async rescheduleToNextDay(originalData: any): Promise<ConflictResolution> {
        const originalStart = new Date(originalData.startTime);
        const originalEnd = new Date(originalData.endTime);
        
        const nextDayStart = new Date(originalStart);
        nextDayStart.setDate(nextDayStart.getDate() + 1);
        
        const nextDayEnd = new Date(originalEnd);
        nextDayEnd.setDate(nextDayEnd.getDate() + 1);

        // Check if next day has conflicts
        const newConflicts = await this.detectConflicts({
            ...originalData,
            startTime: nextDayStart.toISOString(),
            endTime: nextDayEnd.toISOString()
        });

        if (newConflicts.length === 0) {
            return {
                type: 'reschedule',
                newTime: `${nextDayStart.toLocaleString()} - ${nextDayEnd.toLocaleString()}`,
                message: `Successfully rescheduled to tomorrow at ${nextDayStart.toLocaleString()}`
            };
        } else {
            return {
                type: 'alternative',
                message: 'Tomorrow also has conflicts. Here are some alternatives:',
                alternatives: await this.findNextAvailableSlots(originalData, 3)
            };
        }
    }

    /**
     * Find alternative time slots when everyone is available
     */
    private async findAlternativeTimeSlots(originalData: any): Promise<ConflictResolution> {
        const alternatives = await this.findNextAvailableSlots(originalData, 5);
        
        return {
            type: 'alternative',
            message: 'Found these alternative time slots when everyone is available:',
            alternatives
        };
    }

    /**
     * Find the next available time slots for all attendees
     */
    private async findNextAvailableSlots(originalData: any, maxSlots: number): Promise<string[]> {
        try {
            const alternatives: string[] = [];
            const originalStart = new Date(originalData.startTime);
            const duration = new Date(originalData.endTime).getTime() - originalStart.getTime();
            
            // Search for available slots over the next 7 days
            for (let dayOffset = 0; dayOffset < 7 && alternatives.length < maxSlots; dayOffset++) {
                const searchDate = new Date(originalStart);
                searchDate.setDate(searchDate.getDate() + dayOffset);
                
                // Check time slots throughout the day (9 AM to 6 PM)
                for (let hour = 9; hour < 18 && alternatives.length < maxSlots; hour++) {
                    const slotStart = new Date(searchDate);
                    slotStart.setHours(hour, 0, 0, 0);
                    
                    const slotEnd = new Date(slotStart.getTime() + duration);
                    
                    // Check if this slot has conflicts
                    const conflicts = await this.detectConflicts({
                        ...originalData,
                        startTime: slotStart.toISOString(),
                        endTime: slotEnd.toISOString()
                    });
                    
                    if (conflicts.length === 0) {
                        alternatives.push(`${slotStart.toLocaleString()} - ${slotEnd.toLocaleString()}`);
                    }
                }
            }
            
            return alternatives;
        } catch (error) {
            console.error('Error finding alternative slots:', error);
            return ['Please check your calendar for available times'];
        }
    }

    /**
     * Suggest optimal meeting times based on attendee preferences and availability
     */
    async suggestOptimalTimes(attendees: string[], duration: number = 60): Promise<string[]> {
        try {
            const suggestions: string[] = [];
            const now = new Date();
            
            // Look for optimal times over the next 5 business days
            for (let dayOffset = 0; dayOffset < 5 && suggestions.length < 3; dayOffset++) {
                const searchDate = new Date(now);
                searchDate.setDate(searchDate.getDate() + dayOffset);
                
                // Skip weekends
                if (searchDate.getDay() === 0 || searchDate.getDay() === 6) {
                    continue;
                }
                
                // Preferred meeting times: 10 AM, 2 PM, 4 PM
                const preferredHours = [10, 14, 16];
                
                for (const hour of preferredHours) {
                    const slotStart = new Date(searchDate);
                    slotStart.setHours(hour, 0, 0, 0);
                    
                    const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);
                    
                    // Check availability for all attendees
                    const conflicts = await this.detectConflicts({
                        attendees,
                        startTime: slotStart.toISOString(),
                        endTime: slotEnd.toISOString()
                    });
                    
                    if (conflicts.length === 0) {
                        suggestions.push(`${slotStart.toLocaleString()} - ${slotEnd.toLocaleString()}`);
                        
                        if (suggestions.length >= 3) {
                            break;
                        }
                    }
                }
            }
            
            return suggestions;
        } catch (error) {
            console.error('Error suggesting optimal times:', error);
            return [];
        }
    }

    /**
     * Analyze meeting patterns to suggest better scheduling practices
     */
    async analyzeMeetingPatterns(userId: string): Promise<any> {
        try {
            // This would analyze the user's meeting history to provide insights
            // For now, return mock insights
            return {
                busyHours: ['9-10 AM', '2-3 PM'],
                optimalTimes: ['10-11 AM', '3-4 PM'],
                averageMeetingDuration: 45,
                meetingFrequency: 'high',
                suggestions: [
                    'Consider blocking calendar time for focused work',
                    'Schedule shorter meetings to increase productivity',
                    'Group meetings together to minimize context switching'
                ]
            };
        } catch (error) {
            console.error('Error analyzing meeting patterns:', error);
            return null;
        }
    }
}
