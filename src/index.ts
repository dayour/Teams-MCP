import { BotFrameworkAdapter, ConversationState, MemoryStorage, UserState } from 'botbuilder';
import restify from 'restify';
import { SchedulingBot } from './bots/schedulingBot';
import { GraphService } from './services/graphService';

// Create HTTP server
const server = restify.createServer();
server.use(restify.plugins.bodyParser());

// Create adapter
const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId || '',
    appPassword: process.env.MicrosoftAppPassword || ''
});

// Create storage and conversation state
const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

// Create Graph service
const graphService = new GraphService();

// Create the main bot
const bot = new SchedulingBot(conversationState, userState, graphService);

// Error handler
adapter.onTurnError = async (context, error) => {
    console.error(`\n [onTurnError] unhandled error: ${error}`);
    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
    await conversationState.delete(context);
    await userState.delete(context);
};

// Listen for incoming requests
server.post('/api/messages', async (req, res) => {
    await adapter.process(req, res, (context) => bot.run(context));
});

// Listen for incoming requests
server.listen(process.env.port || process.env.PORT || 4978, () => {
    console.log(`\n${server.name} listening to ${server.url}`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo test your bot, see: https://aka.ms/debug-with-emulator');
});
