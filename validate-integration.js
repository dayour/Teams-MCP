#!/usr/bin/env node

/**
 * Validation script for Teams MCP GitHub Copilot Integration
 * 
 * This script verifies that the VS Code extension is properly configured
 * for GitHub Copilot chat participant integration.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Teams MCP GitHub Copilot Integration...\n');

// Check package.json for chat participant configuration
const packagePath = path.join(__dirname, 'vscode-extension', 'package.json');
let success = true;

try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Check for chatParticipants contribution
    if (packageJson.contributes && packageJson.contributes.chatParticipants) {
        const chatParticipants = packageJson.contributes.chatParticipants;
        const teamsParticipant = chatParticipants.find(p => p.id === 'teams');
        
        if (teamsParticipant) {
            console.log('✅ Chat participant "teams" is properly configured');
            console.log(`   - Name: ${teamsParticipant.name}`);
            console.log(`   - Description: ${teamsParticipant.description}`);
            console.log(`   - Commands: ${teamsParticipant.commands?.length || 0}`);
            
            if (teamsParticipant.commands && teamsParticipant.commands.length > 0) {
                console.log('   - Available commands:');
                teamsParticipant.commands.forEach(cmd => {
                    console.log(`     • /${cmd.name}: ${cmd.description}`);
                });
            }
        } else {
            console.log('❌ Chat participant "teams" not found in configuration');
            success = false;
        }
    } else {
        console.log('❌ No chatParticipants contribution found in package.json');
        success = false;
    }
    
} catch (error) {
    console.log(`❌ Error reading package.json: ${error.message}`);
    success = false;
}

// Check for compiled output files
const outDir = path.join(__dirname, 'vscode-extension', 'out');
const requiredFiles = ['extension.js', 'chatParticipant.js'];

console.log('\n🔍 Checking compiled output files...');

for (const file of requiredFiles) {
    const filePath = path.join(outDir, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} exists`);
    } else {
        console.log(`❌ ${file} missing`);
        success = false;
    }
}

// Check source files
const srcDir = path.join(__dirname, 'vscode-extension', 'src');
const requiredSrcFiles = ['extension.ts', 'chatParticipant.ts'];

console.log('\n🔍 Checking source files...');

for (const file of requiredSrcFiles) {
    const filePath = path.join(srcDir, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} exists`);
        
        // Check if chatParticipant.ts contains required components
        if (file === 'chatParticipant.ts') {
            const content = fs.readFileSync(filePath, 'utf8');
            const checks = [
                { pattern: /class TeamsChatParticipant/, name: 'TeamsChatParticipant class' },
                { pattern: /vscode\.chat\.createChatParticipant/, name: 'Chat participant creation' },
                { pattern: /handleChatRequest/, name: 'Chat request handler' },
                { pattern: /schedule_meeting|check_availability/, name: 'MCP tool mapping' }
            ];
            
            checks.forEach(check => {
                if (check.pattern.test(content)) {
                    console.log(`   ✅ Contains ${check.name}`);
                } else {
                    console.log(`   ❌ Missing ${check.name}`);
                    success = false;
                }
            });
        }
        
        // Check if extension.ts imports and uses chat participant
        if (file === 'extension.ts') {
            const content = fs.readFileSync(filePath, 'utf8');
            const checks = [
                { pattern: /import.*TeamsChatParticipant/, name: 'TeamsChatParticipant import' },
                { pattern: /chatParticipant\.register/, name: 'Chat participant registration' },
                { pattern: /new TeamsChatParticipant/, name: 'Chat participant instantiation' }
            ];
            
            checks.forEach(check => {
                if (check.pattern.test(content)) {
                    console.log(`   ✅ Contains ${check.name}`);
                } else {
                    console.log(`   ❌ Missing ${check.name}`);
                    success = false;
                }
            });
        }
    } else {
        console.log(`❌ ${file} missing`);
        success = false;
    }
}

// Check MCP server integration
console.log('\n🔍 Checking MCP server integration...');

const mcpServerPath = path.join(__dirname, 'lib', 'mcp-server.js');
if (fs.existsSync(mcpServerPath)) {
    console.log('✅ MCP server compiled and available');
} else {
    console.log('❌ MCP server not found - run npm run build');
    success = false;
}

// Summary
console.log('\n' + '='.repeat(50));
if (success) {
    console.log('🎉 All validations passed!');
    console.log('\nNext steps:');
    console.log('1. Install the extension in VS Code');
    console.log('2. Ensure GitHub Copilot is installed');
    console.log('3. Configure Teams authentication');
    console.log('4. Test with: @teams /schedule meeting with someone@company.com');
} else {
    console.log('❌ Some validations failed. Please fix the issues above.');
    process.exit(1);
}

console.log('\n📚 See GITHUB-COPILOT-INTEGRATION.md for usage instructions.');