import {
    TeamsActivityHandler,
    TurnContext,
    ConversationState,
    UserState,
    MessageFactory,
    CardFactory,
    Activity,
    AdaptiveCardInvokeValue,
    AdaptiveCardInvokeResponse
} from 'botbuilder';
import { GraphService } from '../services/graphService';
import { SchedulingCardService } from '../services/schedulingCardService';
import { ConflictResolutionService } from '../services/conflictResolutionService';

/**
 * Main scheduling bot that handles Teams conversations and scheduling requests
 */
export class SchedulingBot extends TeamsActivityHandler {
    private conversationState: ConversationState;
    private userState: UserState;
    private graphService: GraphService;
    private cardService: SchedulingCardService;
    private conflictService: ConflictResolutionService;

    constructor(
        conversationState: ConversationState,
        userState: UserState,
        graphService: GraphService
    ) {
        super();

        this.conversationState = conversationState;
        this.userState = userState;
        this.graphService = graphService;
        this.cardService = new SchedulingCardService();
        this.conflictService = new ConflictResolutionService(graphService);

        // Handle incoming messages
        this.onMessage(async (context, next) => {
            await this.handleMessage(context);
            await next();
        });

        // Handle members added to the conversation
        this.onMembersAdded(async (context, next) => {
            await this.sendWelcomeMessage(context);
            await next();
        });

        // Override the onAdaptiveCardInvoke method
    }

    /**
     * Override the onAdaptiveCardInvoke method to handle adaptive card actions
     */
    protected async onAdaptiveCardInvoke(context: TurnContext, invokeValue: AdaptiveCardInvokeValue): Promise<AdaptiveCardInvokeResponse> {
        return await this.handleAdaptiveCardAction(context, invokeValue);
    }

    /**
     * Handle incoming text messages and natural language scheduling requests
     */
    private async handleMessage(context: TurnContext): Promise<void> {
        const text = context.activity.text?.toLowerCase().trim();

        if (!text) return;

        // Parse scheduling intents from natural language
        if (this.isSchedulingRequest(text)) {
            await this.handleSchedulingRequest(context, text);
        } else if (this.isAvailabilityRequest(text)) {
            await this.handleAvailabilityRequest(context);
        } else if (this.isRoomBookingRequest(text)) {
            await this.handleRoomBookingRequest(context, text);
        } else {
            await this.sendHelpMessage(context);
        }
    }

    /**
     * Check if the message is a scheduling request
     */
    private isSchedulingRequest(text: string): boolean {
        const schedulingKeywords = [
            'schedule', 'book', 'meeting', 'appointment', 
            'calendar', 'arrange', 'plan', 'set up'
        ];
        return schedulingKeywords.some(keyword => text.includes(keyword));
    }

    /**
     * Check if the message is an availability request
     */
    private isAvailabilityRequest(text: string): boolean {
        const availabilityKeywords = [
            'available', 'free', 'busy', 'schedule', 'calendar'
        ];
        return availabilityKeywords.some(keyword => text.includes(keyword)) && 
               (text.includes('when') || text.includes('what time') || text.includes('availability'));
    }

    /**
     * Check if the message is a room booking request
     */
    private isRoomBookingRequest(text: string): boolean {
        const roomKeywords = ['room', 'conference room', 'meeting room', 'space'];
        return roomKeywords.some(keyword => text.includes(keyword));
    }

    /**
     * Handle scheduling requests with conflict detection
     */
    private async handleSchedulingRequest(context: TurnContext, text: string): Promise<void> {
        try {
            // Show initial scheduling card
            const schedulingCard = this.cardService.createSchedulingCard();
            await context.sendActivity(MessageFactory.attachment(schedulingCard));
        } catch (error) {
            console.error('Error handling scheduling request:', error);
            await context.sendActivity('Sorry, I encountered an error while processing your scheduling request.');
        }
    }

    /**
     * Handle availability requests
     */
    private async handleAvailabilityRequest(context: TurnContext): Promise<void> {
        try {
            // Get user's calendar availability
            const availability = await this.graphService.getUserAvailability(context.activity.from.aadObjectId);
            const availabilityCard = this.cardService.createAvailabilityCard(availability);
            await context.sendActivity(MessageFactory.attachment(availabilityCard));
        } catch (error) {
            console.error('Error getting availability:', error);
            await context.sendActivity('Sorry, I couldn\'t retrieve your availability at the moment.');
        }
    }

    /**
     * Handle room booking requests
     */
    private async handleRoomBookingRequest(context: TurnContext, text: string): Promise<void> {
        try {
            // Get available rooms
            const rooms = await this.graphService.getAvailableRooms();
            const roomCard = this.cardService.createRoomSelectionCard(rooms);
            await context.sendActivity(MessageFactory.attachment(roomCard));
        } catch (error) {
            console.error('Error getting rooms:', error);
            await context.sendActivity('Sorry, I couldn\'t retrieve available rooms at the moment.');
        }
    }

    /**
     * Handle adaptive card actions (booking, conflict resolution, etc.)
     */
    private async handleAdaptiveCardAction(context: TurnContext, invokeValue: AdaptiveCardInvokeValue): Promise<AdaptiveCardInvokeResponse> {
        try {
            const action = invokeValue.action;
            
            switch (action.type) {
                case 'bookMeeting':
                    return await this.bookMeeting(context, action.data);
                case 'resolveConflict':
                    return await this.resolveConflict(context, action.data);
                case 'selectRoom':
                    return await this.selectRoom(context, action.data);
                case 'checkAvailability':
                    return await this.checkAvailability(context, action.data);
                default:
                    return { statusCode: 200, type: '', value: {} };
            }
        } catch (error) {
            console.error('Error handling adaptive card action:', error);
            return { statusCode: 500, type: '', value: {} };
        }
    }

    /**
     * Book a meeting with conflict detection
     */
    private async bookMeeting(context: TurnContext, data: any): Promise<AdaptiveCardInvokeResponse> {
        try {
            // Check for conflicts
            const conflicts = await this.conflictService.detectConflicts(data);
            
            if (conflicts.length > 0) {
                // Show conflict resolution options
                const conflictCard = this.cardService.createConflictResolutionCard(conflicts, data);
                await context.sendActivity(MessageFactory.attachment(conflictCard));
                return { statusCode: 200, type: '', value: {} };
            }

            // No conflicts, proceed with booking
            const meeting = await this.graphService.createMeeting(data);
            const confirmationCard = this.cardService.createBookingConfirmationCard(meeting);
            await context.sendActivity(MessageFactory.attachment(confirmationCard));
            
            return { statusCode: 200, type: '', value: {} };
        } catch (error) {
            console.error('Error booking meeting:', error);
            await context.sendActivity('Sorry, I couldn\'t book the meeting. Please try again.');
            return { statusCode: 500, type: '', value: {} };
        }
    }

    /**
     * Resolve scheduling conflicts
     */
    private async resolveConflict(context: TurnContext, data: any): Promise<AdaptiveCardInvokeResponse> {
        try {
            const resolution = await this.conflictService.resolveConflict(data);
            const resolutionCard = this.cardService.createResolutionCard(resolution);
            await context.sendActivity(MessageFactory.attachment(resolutionCard));
            return { statusCode: 200, type: '', value: {} };
        } catch (error) {
            console.error('Error resolving conflict:', error);
            return { statusCode: 500, type: '', value: {} };
        }
    }

    /**
     * Select a room for the meeting
     */
    private async selectRoom(context: TurnContext, data: any): Promise<AdaptiveCardInvokeResponse> {
        try {
            const roomDetails = await this.graphService.getRoomDetails(data.roomId);
            const roomCard = this.cardService.createRoomDetailsCard(roomDetails);
            await context.sendActivity(MessageFactory.attachment(roomCard));
            return { statusCode: 200, type: '', value: {} };
        } catch (error) {
            console.error('Error selecting room:', error);
            return { statusCode: 500, type: '', value: {} };
        }
    }

    /**
     * Check availability for specific time slots
     */
    private async checkAvailability(context: TurnContext, data: any): Promise<AdaptiveCardInvokeResponse> {
        try {
            const availability = await this.graphService.checkTimeSlotAvailability(data);
            const availabilityCard = this.cardService.createTimeSlotCard(availability);
            await context.sendActivity(MessageFactory.attachment(availabilityCard));
            return { statusCode: 200, type: '', value: {} };
        } catch (error) {
            console.error('Error checking availability:', error);
            return { statusCode: 500, type: '', value: {} };
        }
    }

    /**
     * Send welcome message when bot is added to conversation
     */
    private async sendWelcomeMessage(context: TurnContext): Promise<void> {
        const welcomeCard = this.cardService.createWelcomeCard();
        await context.sendActivity(MessageFactory.attachment(welcomeCard));
    }

    /**
     * Send help message for unrecognized commands
     */
    private async sendHelpMessage(context: TurnContext): Promise<void> {
        const helpCard = this.cardService.createHelpCard();
        await context.sendActivity(MessageFactory.attachment(helpCard));
    }

    /**
     * Save conversation and user state
     */
    public async run(context: TurnContext): Promise<void> {
        await super.run(context);
        await this.conversationState.saveChanges(context, false);
        await this.userState.saveChanges(context, false);
    }
}
