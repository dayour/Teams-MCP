#!/usr/bin/env node

/**
 * Facilitator Agent Discovery Tool
 * 
 * This tool exports agent discovery metadata for Windows 11 ODR (On-device Agent Registry)
 * registration and provides information about the Teams MCP server's capabilities.
 * 
 * Usage:
 *   node lib/facilitator-discovery.js export       # Export discovery metadata to JSON
 *   node lib/facilitator-discovery.js stats        # Show execution statistics
 *   node lib/facilitator-discovery.js metadata     # Show agent metadata
 */

import { facilitatorAgent } from './facilitator-agent.js';
import * as fs from 'fs';
import * as path from 'path';

const command = process.argv[2] || 'help';

function showHelp() {
  console.log(`
Facilitator Agent Discovery Tool - Teams MCP Server

Usage:
  node lib/facilitator-discovery.js [command]

Commands:
  export      Export discovery metadata for ODR registration (JSON format)
  stats       Show execution statistics
  metadata    Show agent metadata
  help        Show this help message

Examples:
  # Export discovery info to file
  node lib/facilitator-discovery.js export > teams-mcp-discovery.json

  # Register with Windows 11 ODR (requires administrator privileges)
  node lib/facilitator-discovery.js export > teams-mcp-discovery.json
  odr.exe register teams-mcp-discovery.json

  # View current statistics
  node lib/facilitator-discovery.js stats

For more information, see:
  https://learn.microsoft.com/en-us/windows/ai/mcp/overview
`);
}

function exportDiscoveryInfo() {
  const discoveryInfo = facilitatorAgent.getDiscoveryInfo();
  console.log(JSON.stringify(discoveryInfo, null, 2));
}

function showMetadata() {
  const metadata = facilitatorAgent.getMetadata();
  console.log('Teams MCP Server - Agent Metadata');
  console.log('=====================================');
  console.log(`Name: ${metadata.name}`);
  console.log(`Version: ${metadata.version}`);
  console.log(`Description: ${metadata.description}`);
  console.log('');
  console.log('Capabilities:');
  Object.entries(metadata.capabilities).forEach(([key, value]) => {
    console.log(`  - ${key}: ${value ? 'enabled' : 'disabled'}`);
  });
  console.log('');
  console.log('Required Permissions:');
  metadata.requiredPermissions.forEach(permission => {
    console.log(`  - ${permission}`);
  });
  console.log('');
  console.log('Security Baseline:');
  Object.entries(metadata.securityBaseline).forEach(([key, value]) => {
    console.log(`  - ${key}: ${value}`);
  });
  console.log('');
  console.log('Endpoints:');
  console.log(`  - MCP Transport: ${metadata.endpoints.mcp.transport}`);
  console.log(`  - MCP Protocol: ${metadata.endpoints.mcp.protocol}`);
}

function showStatistics() {
  const stats = facilitatorAgent.getStatistics();
  console.log('Teams MCP Server - Execution Statistics');
  console.log('=========================================');
  console.log(`Total Executions: ${stats.totalExecutions}`);
  console.log(`Successful: ${stats.successfulExecutions}`);
  console.log(`Failed: ${stats.failedExecutions}`);
  console.log(`Unauthorized Attempts: ${stats.unauthorizedAttempts}`);
  console.log(`Average Duration: ${stats.averageDuration}ms`);
  
  if (stats.totalExecutions > 0) {
    const successRate = ((stats.successfulExecutions / stats.totalExecutions) * 100).toFixed(2);
    console.log(`Success Rate: ${successRate}%`);
  }
}

// Main execution
switch (command) {
  case 'export':
    exportDiscoveryInfo();
    break;
  case 'stats':
    showStatistics();
    break;
  case 'metadata':
    showMetadata();
    break;
  case 'help':
  default:
    showHelp();
    break;
}
