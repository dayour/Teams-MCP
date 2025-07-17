import { SchedulingRequest } from '../models/types';

/**
 * Natural language processing utilities for parsing scheduling requests
 */
export class NLPUtils {
    
    /**
     * Extract scheduling intent and entities from natural language text
     */
    static parseSchedulingRequest(text: string): Partial<SchedulingRequest> | null {
        const lowerText = text.toLowerCase();
        
        // Check for scheduling keywords
        const schedulingWords = ['schedule', 'book', 'arrange', 'plan', 'set up', 'organize'];
        const hasSchedulingIntent = schedulingWords.some(word => lowerText.includes(word));
        
        if (!hasSchedulingIntent) {
            return null;
        }

        const request: Partial<SchedulingRequest> = {};

        // Extract meeting subject
        const subjectMatch = this.extractSubject(text);
        if (subjectMatch) {
            request.subject = subjectMatch;
        }

        // Extract time information
        const timeInfo = this.extractTimeInfo(text);
        if (timeInfo) {
            request.startTime = timeInfo.start;
            request.endTime = timeInfo.end;
        }

        // Extract attendees
        const attendees = this.extractAttendees(text);
        if (attendees.length > 0) {
            request.attendees = attendees;
        }

        // Check for room requirements
        if (this.hasRoomRequirement(text)) {
            request.needsRoom = true;
            request.roomRequirements = this.extractRoomRequirements(text);
        }

        return request;
    }

    /**
     * Extract meeting subject from text
     */
    private static extractSubject(text: string): string | null {
        // Look for patterns like "schedule a meeting about X" or "book X meeting"
        const patterns = [
            /(?:schedule|book|arrange).*?(?:meeting|call|session).*?(?:about|for|regarding)\s+(.+?)(?:\s+(?:at|on|with|for)|$)/i,
            /(?:schedule|book|arrange)\s+(?:a|an)?\s*(.+?)\s+(?:meeting|call|session)/i,
            /"([^"]+)"/g, // Text in quotes
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }

        return null;
    }

    /**
     * Extract time information from text
     */
    private static extractTimeInfo(text: string): { start: string; end: string } | null {
        // This is a simplified implementation
        // In a real application, you'd use a more sophisticated NLP library
        
        const timePatterns = [
            // "tomorrow at 2 PM"
            /tomorrow\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm))/i,
            // "Monday at 10 AM"
            /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm))/i,
            // "at 3 PM"
            /at\s+(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm))/i,
            // "2:30 PM"
            /(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/i
        ];

        for (const pattern of timePatterns) {
            const match = text.match(pattern);
            if (match) {
                const timeStr = match[match.length - 1]; // Get the time part
                const startTime = this.parseTimeString(timeStr);
                if (startTime) {
                    // Default to 1-hour meeting
                    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
                    return {
                        start: startTime.toISOString(),
                        end: endTime.toISOString()
                    };
                }
            }
        }

        return null;
    }

    /**
     * Parse a time string like "2 PM" or "14:30" into a Date object
     */
    private static parseTimeString(timeStr: string): Date | null {
        try {
            const now = new Date();
            let hour: number;
            let minute = 0;

            // Handle AM/PM format
            if (/AM|PM|am|pm/i.test(timeStr)) {
                const [time, period] = timeStr.split(/\s*([ap]m)/i);
                const [hourStr, minuteStr] = time.split(':');
                hour = parseInt(hourStr);
                if (minuteStr) {
                    minute = parseInt(minuteStr);
                }

                if (period.toLowerCase() === 'pm' && hour !== 12) {
                    hour += 12;
                } else if (period.toLowerCase() === 'am' && hour === 12) {
                    hour = 0;
                }
            } else {
                // Handle 24-hour format
                const [hourStr, minuteStr] = timeStr.split(':');
                hour = parseInt(hourStr);
                if (minuteStr) {
                    minute = parseInt(minuteStr);
                }
            }

            const result = new Date(now);
            result.setHours(hour, minute, 0, 0);

            // If the time has passed today, schedule for tomorrow
            if (result <= now) {
                result.setDate(result.getDate() + 1);
            }

            return result;
        } catch (error) {
            return null;
        }
    }

    /**
     * Extract attendee email addresses from text
     */
    private static extractAttendees(text: string): string[] {
        const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const emails = text.match(emailPattern) || [];
        return emails;
    }

    /**
     * Check if text indicates a need for a meeting room
     */
    private static hasRoomRequirement(text: string): boolean {
        const roomKeywords = [
            'room', 'conference room', 'meeting room', 'space', 'venue',
            'in person', 'face to face', 'f2f', 'office'
        ];
        
        return roomKeywords.some(keyword => 
            text.toLowerCase().includes(keyword.toLowerCase())
        );
    }

    /**
     * Extract room requirements from text
     */
    private static extractRoomRequirements(text: string): any {
        const requirements: any = {};

        // Extract capacity requirements
        const capacityMatch = text.match(/(\d+)\s*(?:people|person|attendees|participants)/i);
        if (capacityMatch) {
            requirements.capacity = parseInt(capacityMatch[1]);
        }

        // Extract equipment requirements
        const equipment = [];
        const equipmentKeywords = [
            'projector', 'screen', 'whiteboard', 'video conference', 'webcam',
            'microphone', 'speakers', 'tv', 'monitor'
        ];

        for (const keyword of equipmentKeywords) {
            if (text.toLowerCase().includes(keyword.toLowerCase())) {
                equipment.push(keyword);
            }
        }

        if (equipment.length > 0) {
            requirements.equipment = equipment;
        }

        return requirements;
    }

    /**
     * Extract duration from text
     */
    static extractDuration(text: string): number | null {
        const patterns = [
            { regex: /(\d+)\s*h\s*(\d+)\s*m/i, type: 'hm' }, // 1h 30m format
            { regex: /(\d+)\s*(?:hour|hours|hr|hrs)/i, type: 'hour' },
            { regex: /(\d+)\s*(?:minute|minutes|min|mins)/i, type: 'minute' },
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern.regex);
            if (match) {
                if (pattern.type === 'hm') {
                    // Handle "1h 30m" format
                    const hours = parseInt(match[1]);
                    const minutes = parseInt(match[2]);
                    return hours * 60 + minutes;
                } else if (pattern.type === 'hour') {
                    return parseInt(match[1]) * 60; // Convert hours to minutes
                } else if (pattern.type === 'minute') {
                    return parseInt(match[1]);
                }
            }
        }

        return null; // Default duration will be handled elsewhere
    }

    /**
     * Determine if text indicates urgency
     */
    static detectUrgency(text: string): 'low' | 'medium' | 'high' {
        const highUrgencyWords = ['urgent', 'asap', 'immediately', 'emergency', 'critical'];
        const mediumUrgencyWords = ['soon', 'today', 'this week', 'important'];

        const lowerText = text.toLowerCase();

        if (highUrgencyWords.some(word => lowerText.includes(word))) {
            return 'high';
        } else if (mediumUrgencyWords.some(word => lowerText.includes(word))) {
            return 'medium';
        }

        return 'low';
    }

    /**
     * Extract location preferences
     */
    static extractLocationPreference(text: string): string | null {
        const locationPatterns = [
            /(?:in|at)\s+(?:the\s+)?([A-Za-z\s]+(?:building|office|floor|room))/i,
            /(?:location|venue|place):\s*([A-Za-z\s]+)/i,
        ];

        for (const pattern of locationPatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }

        return null;
    }
}
