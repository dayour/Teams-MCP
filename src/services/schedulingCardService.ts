import { CardFactory, Attachment } from 'botbuilder';
import { Availability, Room, Meeting } from './graphService';

/**
 * Service for creating adaptive cards for scheduling interactions
 */
export class SchedulingCardService {
    
    /**
     * Create welcome card when bot is first added
     */
    createWelcomeCard(): Attachment {
        const card = {
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
                {
                    type: 'TextBlock',
                    text: '🤖 Teams Scheduling Assistant',
                    size: 'large',
                    weight: 'bolder',
                    color: 'accent'
                },
                {
                    type: 'TextBlock',
                    text: 'I can help you with:',
                    wrap: true,
                    spacing: 'medium'
                },
                {
                    type: 'TextBlock',
                    text: '• Schedule meetings and appointments',
                    wrap: true
                },
                {
                    type: 'TextBlock',
                    text: '• Check calendar availability',
                    wrap: true
                },
                {
                    type: 'TextBlock',
                    text: '• Book meeting rooms',
                    wrap: true
                },
                {
                    type: 'TextBlock',
                    text: '• Resolve scheduling conflicts',
                    wrap: true
                },
                {
                    type: 'TextBlock',
                    text: '• Generate Teams meeting links',
                    wrap: true
                }
            ],
            actions: [
                {
                    type: 'Action.Submit',
                    title: 'Schedule Meeting',
                    data: { action: { type: 'scheduleNew' } }
                },
                {
                    type: 'Action.Submit',
                    title: 'Check Availability',
                    data: { action: { type: 'checkAvailability' } }
                }
            ]
        };

        return CardFactory.adaptiveCard(card);
    }

    /**
     * Create scheduling form card
     */
    createSchedulingCard(): Attachment {
        const card = {
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
                {
                    type: 'TextBlock',
                    text: '📅 Schedule New Meeting',
                    size: 'large',
                    weight: 'bolder'
                },
                {
                    type: 'Input.Text',
                    id: 'subject',
                    label: 'Meeting Subject',
                    placeholder: 'Enter meeting title'
                },
                {
                    type: 'Input.DateTime',
                    id: 'startTime',
                    label: 'Start Time'
                },
                {
                    type: 'Input.DateTime',
                    id: 'endTime',
                    label: 'End Time'
                },
                {
                    type: 'Input.Text',
                    id: 'attendees',
                    label: 'Attendees (emails)',
                    placeholder: 'user1@company.com, user2@company.com',
                    isMultiline: true
                },
                {
                    type: 'Input.Text',
                    id: 'description',
                    label: 'Description (optional)',
                    placeholder: 'Meeting agenda or description',
                    isMultiline: true
                },
                {
                    type: 'Input.Toggle',
                    id: 'needsRoom',
                    label: 'Need a meeting room?',
                    title: 'Book a room'
                }
            ],
            actions: [
                {
                    type: 'Action.Submit',
                    title: 'Schedule Meeting',
                    data: { action: { type: 'bookMeeting' } }
                }
            ]
        };

        return CardFactory.adaptiveCard(card);
    }

    /**
     * Create availability display card
     */
    createAvailabilityCard(availability: Availability[]): Attachment {
        const freeSlots = availability.filter(slot => slot.freeBusyStatus === 'free');
        
        const card = {
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
                {
                    type: 'TextBlock',
                    text: '📅 Your Availability',
                    size: 'large',
                    weight: 'bolder'
                },
                {
                    type: 'TextBlock',
                    text: freeSlots.length > 0 ? 'You have free time slots:' : 'No free slots found',
                    wrap: true
                },
                ...freeSlots.map(slot => ({
                    type: 'TextBlock',
                    text: `🟢 ${new Date(slot.start).toLocaleString()} - ${new Date(slot.end).toLocaleString()}`,
                    wrap: true
                }))
            ],
            actions: [
                {
                    type: 'Action.Submit',
                    title: 'Schedule in Free Slot',
                    data: { action: { type: 'scheduleInSlot' } }
                }
            ]
        };

        return CardFactory.adaptiveCard(card);
    }

    /**
     * Create room selection card
     */
    createRoomSelectionCard(rooms: Room[]): Attachment {
        const card = {
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
                {
                    type: 'TextBlock',
                    text: '🏢 Available Meeting Rooms',
                    size: 'large',
                    weight: 'bolder'
                },
                ...rooms.map(room => ({
                    type: 'Container',
                    items: [
                        {
                            type: 'ColumnSet',
                            columns: [
                                {
                                    type: 'Column',
                                    width: 'stretch',
                                    items: [
                                        {
                                            type: 'TextBlock',
                                            text: room.displayName,
                                            weight: 'bolder'
                                        },
                                        {
                                            type: 'TextBlock',
                                            text: `Capacity: ${room.capacity || 'Unknown'} people`,
                                            size: 'small'
                                        },
                                        {
                                            type: 'TextBlock',
                                            text: `Equipment: ${room.equipment?.join(', ') || 'Basic'}`,
                                            size: 'small'
                                        }
                                    ]
                                },
                                {
                                    type: 'Column',
                                    width: 'auto',
                                    items: [
                                        {
                                            type: 'TextBlock',
                                            text: room.isAvailable ? '✅' : '❌',
                                            size: 'large'
                                        }
                                    ]
                                }
                            ]
                        }
                    ],
                    separator: true,
                    selectAction: room.isAvailable ? {
                        type: 'Action.Submit',
                        data: { action: { type: 'selectRoom', roomId: room.id } }
                    } : undefined
                }))
            ]
        };

        return CardFactory.adaptiveCard(card);
    }

    /**
     * Create conflict resolution card
     */
    createConflictResolutionCard(conflicts: any[], originalData: any): Attachment {
        const card = {
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
                {
                    type: 'TextBlock',
                    text: '⚠️ Scheduling Conflicts Detected',
                    size: 'large',
                    weight: 'bolder',
                    color: 'warning'
                },
                {
                    type: 'TextBlock',
                    text: 'The following conflicts were found:',
                    wrap: true
                },
                ...conflicts.map(conflict => ({
                    type: 'TextBlock',
                    text: `• ${conflict.attendee} has ${conflict.type} at ${conflict.time}`,
                    wrap: true
                })),
                {
                    type: 'TextBlock',
                    text: 'Suggested alternatives:',
                    weight: 'bolder',
                    spacing: 'medium'
                },
                {
                    type: 'TextBlock',
                    text: '• Move meeting 1 hour later',
                    wrap: true
                },
                {
                    type: 'TextBlock',
                    text: '• Schedule for tomorrow at the same time',
                    wrap: true
                },
                {
                    type: 'TextBlock',
                    text: '• Find alternative attendees',
                    wrap: true
                }
            ],
            actions: [
                {
                    type: 'Action.Submit',
                    title: 'Move 1 Hour Later',
                    data: { action: { type: 'resolveConflict', resolution: 'move1hour', originalData } }
                },
                {
                    type: 'Action.Submit',
                    title: 'Schedule Tomorrow',
                    data: { action: { type: 'resolveConflict', resolution: 'tomorrow', originalData } }
                },
                {
                    type: 'Action.Submit',
                    title: 'Book Anyway',
                    data: { action: { type: 'bookMeeting', force: true, originalData } }
                }
            ]
        };

        return CardFactory.adaptiveCard(card);
    }

    /**
     * Create booking confirmation card
     */
    createBookingConfirmationCard(meeting: Meeting): Attachment {
        const card = {
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
                {
                    type: 'TextBlock',
                    text: '✅ Meeting Scheduled Successfully!',
                    size: 'large',
                    weight: 'bolder',
                    color: 'good'
                },
                {
                    type: 'TextBlock',
                    text: `**Subject:** ${meeting.subject}`,
                    wrap: true
                },
                {
                    type: 'TextBlock',
                    text: `**Time:** ${new Date(meeting.start.dateTime).toLocaleString()} - ${new Date(meeting.end.dateTime).toLocaleString()}`,
                    wrap: true
                },
                {
                    type: 'TextBlock',
                    text: `**Attendees:** ${meeting.attendees.map(a => a.emailAddress.address).join(', ')}`,
                    wrap: true
                },
                {
                    type: 'TextBlock',
                    text: meeting.onlineMeeting ? `**Teams Link:** [Join Meeting](${meeting.onlineMeeting.joinUrl})` : '',
                    wrap: true
                }
            ],
            actions: [
                {
                    type: 'Action.OpenUrl',
                    title: 'Join Teams Meeting',
                    url: meeting.onlineMeeting?.joinUrl || '#'
                },
                {
                    type: 'Action.Submit',
                    title: 'Add to Calendar',
                    data: { action: { type: 'addToCalendar', meetingId: meeting.id } }
                }
            ]
        };

        return CardFactory.adaptiveCard(card);
    }

    /**
     * Create room details card
     */
    createRoomDetailsCard(room: Room): Attachment {
        const card = {
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
                {
                    type: 'TextBlock',
                    text: `🏢 ${room.displayName}`,
                    size: 'large',
                    weight: 'bolder'
                },
                {
                    type: 'TextBlock',
                    text: `**Capacity:** ${room.capacity} people`,
                    wrap: true
                },
                {
                    type: 'TextBlock',
                    text: `**Email:** ${room.emailAddress}`,
                    wrap: true
                },
                {
                    type: 'TextBlock',
                    text: `**Equipment:** ${room.equipment?.join(', ') || 'Basic setup'}`,
                    wrap: true
                },
                {
                    type: 'TextBlock',
                    text: `**Status:** ${room.isAvailable ? '✅ Available' : '❌ Busy'}`,
                    wrap: true,
                    color: room.isAvailable ? 'good' : 'attention'
                }
            ],
            actions: room.isAvailable ? [
                {
                    type: 'Action.Submit',
                    title: 'Book This Room',
                    data: { action: { type: 'bookRoom', roomId: room.id } }
                }
            ] : []
        };

        return CardFactory.adaptiveCard(card);
    }

    /**
     * Create time slot availability card
     */
    createTimeSlotCard(availability: Availability[]): Attachment {
        const card = {
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
                {
                    type: 'TextBlock',
                    text: '⏰ Time Slot Availability',
                    size: 'large',
                    weight: 'bolder'
                },
                ...availability.map(slot => ({
                    type: 'TextBlock',
                    text: `${slot.email}: ${slot.freeBusyStatus === 'free' ? '✅ Free' : '❌ Busy'}`,
                    wrap: true,
                    color: slot.freeBusyStatus === 'free' ? 'good' : 'attention'
                }))
            ]
        };

        return CardFactory.adaptiveCard(card);
    }

    /**
     * Create conflict resolution result card
     */
    createResolutionCard(resolution: any): Attachment {
        const card = {
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
                {
                    type: 'TextBlock',
                    text: '🔧 Conflict Resolved',
                    size: 'large',
                    weight: 'bolder',
                    color: 'good'
                },
                {
                    type: 'TextBlock',
                    text: `New meeting time: ${resolution.newTime}`,
                    wrap: true
                },
                {
                    type: 'TextBlock',
                    text: 'All attendees are now available!',
                    wrap: true
                }
            ],
            actions: [
                {
                    type: 'Action.Submit',
                    title: 'Confirm New Time',
                    data: { action: { type: 'confirmResolution', resolution } }
                }
            ]
        };

        return CardFactory.adaptiveCard(card);
    }

    /**
     * Create help card with available commands
     */
    createHelpCard(): Attachment {
        const card = {
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
                {
                    type: 'TextBlock',
                    text: '❓ How to Use Scheduling Assistant',
                    size: 'large',
                    weight: 'bolder'
                },
                {
                    type: 'TextBlock',
                    text: 'You can say things like:',
                    wrap: true,
                    spacing: 'medium'
                },
                {
                    type: 'TextBlock',
                    text: '• "Schedule a meeting tomorrow at 2 PM"',
                    wrap: true
                },
                {
                    type: 'TextBlock',
                    text: '• "What are my available time slots?"',
                    wrap: true
                },
                {
                    type: 'TextBlock',
                    text: '• "Book a conference room for Friday"',
                    wrap: true
                },
                {
                    type: 'TextBlock',
                    text: '• "Check if everyone is free at 3 PM"',
                    wrap: true
                },
                {
                    type: 'TextBlock',
                    text: '• "Find a meeting room with projector"',
                    wrap: true
                }
            ],
            actions: [
                {
                    type: 'Action.Submit',
                    title: 'Schedule Meeting',
                    data: { action: { type: 'scheduleNew' } }
                }
            ]
        };

        return CardFactory.adaptiveCard(card);
    }
}
