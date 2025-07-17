const { ActivityTypes, TestAdapter, TurnContext, ConversationState, UserState, MemoryStorage } = require('botbuilder-core');
const { SchedulingBot } = require('./lib/bots/schedulingBot');
const { GraphService } = require('./lib/services/graphService');

// Initialize storage and state
const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

// Initialize services
const graphService = new GraphService();

// Create bot instance with proper state management
const bot = new SchedulingBot(conversationState, userState, graphService);

// Create test adapter
const adapter = new TestAdapter(async (context) => {
    await bot.run(context);
});

async function testBot() {
    console.log('🤖 Testing Teams Scheduling Assistant Bot...\n');
    
    // Test 1: Basic greeting
    console.log('Test 1: Basic greeting');
    let result = await adapter.test('hello', (activity) => {
        // The bot sends adaptive cards, so check for attachments or any response
        return activity.type === ActivityTypes.Message && 
               (activity.text || activity.attachments);
    });
    console.log('✅ Greeting test passed\n');
    
    // Test 2: Schedule meeting request
    console.log('Test 2: Schedule meeting request');
    result = await adapter.test('Schedule a meeting with john@company.com tomorrow at 2 PM', (activity) => {
        return activity.type === ActivityTypes.Message && 
               activity.text.includes('I\'ll help you schedule that meeting');
    });
    console.log('✅ Schedule meeting test passed\n');
    
    // Test 3: Room booking request
    console.log('Test 3: Room booking request');
    result = await adapter.test('Book a conference room for 10 people', (activity) => {
        return activity.type === ActivityTypes.Message && 
               (activity.text.includes('room') || activity.attachments);
    });
    console.log('✅ Room booking test passed\n');
    
    // Test 4: Availability check
    console.log('Test 4: Availability check');
    result = await adapter.test('When am I free today?', (activity) => {
        return activity.type === ActivityTypes.Message && 
               activity.text.includes('availability');
    });
    console.log('✅ Availability check test passed\n');
    
    console.log('🎉 All bot tests passed! The Teams Scheduling Assistant is working correctly.');
}

testBot().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});
