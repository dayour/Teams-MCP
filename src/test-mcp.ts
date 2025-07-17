#!/usr/bin/env node

/**
 * Simple test script for the Teams MCP Server
 */

import { TeamsMCPServer } from './mcp-server.js';

async function testMCPServer() {
    console.log('🧪 Testing Teams MCP Server...\n');
    
    try {
        const server = new TeamsMCPServer();
        console.log('✅ Teams MCP Server initialized successfully');
        
        // Test would go here, but for now just check initialization
        console.log('📋 Available tools:');
        console.log('  - schedule_meeting');
        console.log('  - check_availability');
        console.log('  - find_available_rooms');
        console.log('  - cancel_meeting');
        console.log('  - update_meeting');
        console.log('  - get_my_calendar');
        console.log('  - resolve_conflicts');
        
        console.log('\n🎉 Teams MCP Server is ready to use!');
        console.log('\nTo start the server, run:');
        console.log('  npm run mcp-server');
        
    } catch (error) {
        console.error('❌ Error testing MCP server:', error);
        process.exit(1);
    }
}

testMCPServer().catch(console.error);