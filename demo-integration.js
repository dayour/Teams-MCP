#!/usr/bin/env node

/**
 * Demonstration of Teams MCP GitHub Copilot Integration
 * 
 * This script demonstrates how the integration works by showing
 * example commands and their expected behavior.
 */

console.log('🎯 Teams MCP GitHub Copilot Integration Demo\n');

console.log('=' .repeat(60));
console.log('📋 Available Commands via @teams in GitHub Copilot Chat');
console.log('=' .repeat(60));

const commands = [
    {
        command: '/schedule',
        description: 'Schedule a new meeting',
        examples: [
            '@teams /schedule meeting with john@company.com tomorrow at 2pm',
            '@teams /schedule "Project Review" with team@company.com Friday 3-4pm',
            '@teams /schedule standup with dev-team@company.com every Monday 9am'
        ]
    },
    {
        command: '/availability',
        description: 'Check attendee availability',
        examples: [
            '@teams /availability check john@company.com for tomorrow',
            '@teams /availability when is everyone free this week?',
            '@teams /availability check team@company.com for Friday 2-4pm'
        ]
    },
    {
        command: '/calendar',
        description: 'View your calendar',
        examples: [
            '@teams /calendar show today\'s events',
            '@teams /calendar what\'s on my schedule for Friday?',
            '@teams /calendar show this week\'s meetings'
        ]
    },
    {
        command: '/rooms',
        description: 'Find available meeting rooms',
        examples: [
            '@teams /rooms find room for 10 people tomorrow 2-3pm',
            '@teams /rooms available conference rooms with video equipment',
            '@teams /rooms book room for team meeting Friday afternoon'
        ]
    },
    {
        command: '/cancel',
        description: 'Cancel a meeting',
        examples: [
            '@teams /cancel meeting ID 12345',
            '@teams /cancel today\'s 3pm meeting',
            '@teams /cancel standup meeting tomorrow'
        ]
    },
    {
        command: '/update',
        description: 'Update a meeting',
        examples: [
            '@teams /update meeting ID 12345 move to 4pm',
            '@teams /update add jane@company.com to project meeting',
            '@teams /update change location to Conference Room B'
        ]
    }
];

commands.forEach((cmd, index) => {
    console.log(`\n${index + 1}. ${cmd.command} - ${cmd.description}`);
    console.log('   Examples:');
    cmd.examples.forEach(example => {
        console.log(`     • ${example}`);
    });
});

console.log('\n' + '=' .repeat(60));
console.log('🗣️  Sample Conversation with GitHub Copilot');
console.log('=' .repeat(60));

const conversation = [
    {
        user: '@teams /schedule team standup with dev-team@company.com tomorrow at 9am',
        teams: `✅ **Schedule Meeting**

Meeting scheduled: "team standup"
📅 Time: tomorrow at 9am
👥 Attendees: dev-team@company.com
📍 Location: Teams meeting

*Note: This is a demonstration. Actual meeting creation requires authentication.*`
    },
    {
        user: '@teams /availability check if everyone is free tomorrow 2-3pm',
        teams: `✅ **Check Availability**

Availability check for: dev-team@company.com
📅 Time range: tomorrow 2-3pm

✅ Available slots found:
• 9:00 AM - 10:00 AM
• 2:00 PM - 3:00 PM
• 4:00 PM - 5:00 PM

*Note: This is sample data. Actual availability requires authentication.*`
    },
    {
        user: '@teams /calendar show today\'s events',
        teams: `📆 **Your Calendar**

**Today's Events:**
• 9:00 AM - Team Standup
• 11:00 AM - Project Review
• 2:00 PM - Client Call

*Note: This is sample data. Actual calendar requires authentication.*`
    }
];

conversation.forEach((exchange, index) => {
    console.log(`\n💬 Example ${index + 1}:`);
    console.log(`User: ${exchange.user}`);
    console.log(`\nTeams: ${exchange.teams}`);
    console.log('\n' + '-'.repeat(50));
});

console.log('\n' + '=' .repeat(60));
console.log('🚀 Getting Started');
console.log('=' .repeat(60));

console.log(`
1. **Install the Extension**
   • Install the Teams MCP extension in VS Code
   • Ensure GitHub Copilot is installed and active

2. **Configure Authentication**
   • Open Command Palette (Ctrl+Shift+P)
   • Run "Teams MCP: Configure"
   • Choose Device Authentication (recommended)

3. **Start Using**
   • Open GitHub Copilot chat
   • Type @teams followed by your command
   • Example: @teams /schedule meeting with colleague@company.com

4. **Verify Setup**
   • Check status: "Teams MCP: Show Status"
   • View logs if needed: "Teams MCP: View Logs"
`);

console.log('=' .repeat(60));
console.log('✨ Benefits of the Integration');
console.log('=' .repeat(60));

const benefits = [
    '🎯 **Seamless Integration** - No app switching required',
    '🗣️  **Natural Language** - Use conversational commands', 
    '⚡ **Quick Actions** - Fast scheduling without complex UI',
    '🤖 **AI Powered** - Copilot understands your scheduling intent',
    '🔗 **Context Aware** - Works with your current conversation',
    '📱 **Consistent** - All Teams actions in one interface'
];

benefits.forEach(benefit => {
    console.log(`   ${benefit}`);
});

console.log('\n🎉 The Teams MCP GitHub Copilot integration is now complete!');
console.log('📚 See GITHUB-COPILOT-INTEGRATION.md for detailed documentation.');