/**
 * Utility functions for date and time operations
 */
export class DateTimeUtils {
    
    /**
     * Format a date for display in the user's locale
     */
    static formatDateTime(date: Date, locale: string = 'en-US'): string {
        return date.toLocaleString(locale, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });
    }

    /**
     * Format a time duration in minutes to a human-readable string
     */
    static formatDuration(minutes: number): string {
        if (minutes < 60) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }
        
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        if (remainingMinutes === 0) {
            return `${hours} hour${hours !== 1 ? 's' : ''}`;
        }
        
        return `${hours}h ${remainingMinutes}m`;
    }

    /**
     * Get the start and end of a business day for a given date
     */
    static getBusinessHours(date: Date, startHour: number = 9, endHour: number = 17): { start: Date; end: Date } {
        const start = new Date(date);
        start.setHours(startHour, 0, 0, 0);
        
        const end = new Date(date);
        end.setHours(endHour, 0, 0, 0);
        
        return { start, end };
    }

    /**
     * Check if a date is a business day (Monday-Friday)
     */
    static isBusinessDay(date: Date): boolean {
        const dayOfWeek = date.getDay();
        return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday = 1, Friday = 5
    }

    /**
     * Get the next business day from a given date
     */
    static getNextBusinessDay(date: Date): Date {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        while (!this.isBusinessDay(nextDay)) {
            nextDay.setDate(nextDay.getDate() + 1);
        }
        
        return nextDay;
    }

    /**
     * Generate time slots for a given day
     */
    static generateTimeSlots(
        date: Date, 
        startHour: number = 9, 
        endHour: number = 17, 
        intervalMinutes: number = 30
    ): Date[] {
        const slots: Date[] = [];
        const current = new Date(date);
        current.setHours(startHour, 0, 0, 0);
        
        const end = new Date(date);
        end.setHours(endHour, 0, 0, 0);
        
        while (current < end) {
            slots.push(new Date(current));
            current.setMinutes(current.getMinutes() + intervalMinutes);
        }
        
        return slots;
    }

    /**
     * Calculate the overlap between two time ranges in minutes
     */
    static calculateOverlapMinutes(
        start1: Date, 
        end1: Date, 
        start2: Date, 
        end2: Date
    ): number {
        const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
        const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));
        
        if (overlapStart >= overlapEnd) {
            return 0; // No overlap
        }
        
        return (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60);
    }

    /**
     * Round a date to the nearest time interval
     */
    static roundToInterval(date: Date, intervalMinutes: number): Date {
        const rounded = new Date(date);
        const minutes = rounded.getMinutes();
        const remainder = minutes % intervalMinutes;
        
        if (remainder === 0) {
            return rounded;
        }
        
        if (remainder < intervalMinutes / 2) {
            // Round down
            rounded.setMinutes(minutes - remainder, 0, 0);
        } else {
            // Round up
            rounded.setMinutes(minutes + (intervalMinutes - remainder), 0, 0);
        }
        
        return rounded;
    }

    /**
     * Convert a time zone offset to a readable string
     */
    static formatTimeZone(offsetMinutes: number): string {
        const sign = offsetMinutes >= 0 ? '+' : '-';
        const absOffset = Math.abs(offsetMinutes);
        const hours = Math.floor(absOffset / 60);
        const minutes = absOffset % 60;
        
        return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    /**
     * Check if a meeting time is within reasonable business hours
     */
    static isReasonableBusinessTime(date: Date): boolean {
        const hour = date.getHours();
        const dayOfWeek = date.getDay();
        
        // Check if it's a business day
        if (!this.isBusinessDay(date)) {
            return false;
        }
        
        // Check if it's within reasonable business hours (8 AM to 6 PM)
        return hour >= 8 && hour < 18;
    }

    /**
     * Get a human-friendly relative time description
     */
    static getRelativeTime(date: Date): string {
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const diffMinutes = Math.round(diffMs / (1000 * 60));
        const diffHours = Math.round(diffMs / (1000 * 60 * 60));
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMinutes < 0) {
            return 'in the past';
        } else if (diffMinutes < 60) {
            return `in ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
        } else if (diffHours < 24) {
            return `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
        } else if (diffDays < 7) {
            return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
        } else {
            return date.toLocaleDateString();
        }
    }

    /**
     * Parse various date/time formats into a Date object
     */
    static parseFlexibleDateTime(input: string): Date | null {
        try {
            // Try standard Date parsing first
            let date = new Date(input);
            if (!isNaN(date.getTime())) {
                return date;
            }

            // Handle relative terms
            const now = new Date();
            const lowerInput = input.toLowerCase().trim();

            if (lowerInput === 'now') {
                return now;
            } else if (lowerInput === 'today') {
                return new Date(now.getFullYear(), now.getMonth(), now.getDate());
            } else if (lowerInput === 'tomorrow') {
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                return new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
            } else if (lowerInput === 'next week') {
                const nextWeek = new Date(now);
                nextWeek.setDate(nextWeek.getDate() + 7);
                return new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate());
            }

            // Handle "in X hours/days" format
            const inPattern = /^in (\d+) (hour|hours|day|days|minute|minutes)$/;
            const inMatch = lowerInput.match(inPattern);
            if (inMatch) {
                const amount = parseInt(inMatch[1]);
                const unit = inMatch[2];
                const result = new Date(now);
                
                if (unit.startsWith('minute')) {
                    result.setMinutes(result.getMinutes() + amount);
                } else if (unit.startsWith('hour')) {
                    result.setHours(result.getHours() + amount);
                } else if (unit.startsWith('day')) {
                    result.setDate(result.getDate() + amount);
                }
                
                return result;
            }

            return null;
        } catch (error) {
            return null;
        }
    }
}
