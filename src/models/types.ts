/**
 * Interface definitions for the scheduling bot
 */

export interface SchedulingRequest {
    subject: string;
    startTime: string;
    endTime: string;
    attendees: string[];
    description?: string;
    location?: string;
    needsRoom?: boolean;
    roomRequirements?: RoomRequirements;
}

export interface RoomRequirements {
    capacity?: number;
    equipment?: string[];
    location?: string;
    accessibility?: boolean;
}

export interface TimeSlot {
    start: string;
    end: string;
    isAvailable: boolean;
    conflicts?: string[];
}

export interface SchedulingContext {
    userId: string;
    conversationId: string;
    currentRequest?: SchedulingRequest;
    suggestedTimes?: TimeSlot[];
    selectedRoom?: string;
}

export interface NotificationPreferences {
    emailReminders: boolean;
    teamsNotifications: boolean;
    reminderMinutes: number[];
}

export interface UserProfile {
    id: string;
    email: string;
    displayName: string;
    timeZone: string;
    workingHours?: {
        start: string;
        end: string;
        daysOfWeek: number[];
    };
    preferences?: NotificationPreferences;
}
