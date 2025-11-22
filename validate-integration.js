#!/usr/bin/env node

/**
 * Production Validation Script for Teams MCP GitHub Copilot Integration
 * 
 * This script performs comprehensive validation of the VS Code extension,
 * MCP server, and all required components for production deployment.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Teams MCP Production Validation\n');
console.log('=' .repeat(60));

// Enhanced validation state tracking
const validation = {
    passed: 0,
    failed: 0,
    warnings: 0,
    errors: []
};

function logSuccess(message) {
    console.log(`✅ ${message}`);
    validation.passed++;
}

function logError(message) {
    console.log(`❌ ${message}`);
    validation.failed++;
    validation.errors.push(message);
}

function logWarning(message) {
    console.log(`⚠️  ${message}`);
    validation.warnings++;
}

function logInfo(message) {
    console.log(`ℹ️  ${message}`);
}


console.log('\n📦 Validating VS Code Extension Configuration...');

// Check package.json for chat participant configuration
const packagePath = path.join(__dirname, 'vscode-extension', 'package.json');

try {
    if (!fs.existsSync(packagePath)) {
        logError('VS Code extension package.json not found');
        process.exit(1);
    }

    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Check for chatParticipants contribution
    if (packageJson.contributes && packageJson.contributes.chatParticipants) {
        const chatParticipants = packageJson.contributes.chatParticipants;
        const teamsParticipant = chatParticipants.find(p => p.id === 'teams');
        
        if (teamsParticipant) {
            logSuccess('Chat participant "teams" is properly configured');
            logInfo(`   Name: ${teamsParticipant.name}`);
            logInfo(`   Description: ${teamsParticipant.description}`);
            logInfo(`   Commands: ${teamsParticipant.commands?.length || 0}`);
            
            if (teamsParticipant.commands && teamsParticipant.commands.length > 0) {
                logInfo('   Available commands:');
                teamsParticipant.commands.forEach(cmd => {
                    logInfo(`     • /${cmd.name}: ${cmd.description}`);
                });
            } else {
                logWarning('No commands configured for Teams chat participant');
            }
        } else {
            logError('Chat participant "teams" not found in configuration');
        }
    } else {
        logError('No chatParticipants contribution found in package.json');
    }
    
} catch (error) {
    logError(`Error reading VS Code extension package.json: ${error.message}`);
}

// Check for compiled output files
const outDir = path.join(__dirname, 'vscode-extension', 'out');
const requiredFiles = ['extension.js', 'chatParticipant.js'];

console.log('\n🏗️  Validating Compiled Extension Files...');

for (const file of requiredFiles) {
    const filePath = path.join(outDir, file);
    if (fs.existsSync(filePath)) {
        logSuccess(`${file} exists`);
        
        // Check file size to ensure compilation was successful
        const stats = fs.statSync(filePath);
        if (stats.size < 100) {
            logWarning(`${file} seems unusually small (${stats.size} bytes)`);
        }
    } else {
        logError(`${file} missing - run npm run build-extension`);
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
console.log('\n🔧 Checking MCP Server Integration...');

const mcpServerPath = path.join(__dirname, 'lib', 'mcp-server.js');
if (fs.existsSync(mcpServerPath)) {
    logSuccess('MCP server compiled and available');
    
    // Check file size to ensure it's not empty
    const stats = fs.statSync(mcpServerPath);
    if (stats.size > 1000) { // Minimum reasonable size for compiled MCP server
        logInfo(`   Server file size: ${Math.round(stats.size / 1024)}KB`);
    } else {
        logWarning('MCP server file seems unusually small');
    }
} else {
    logError('MCP server not found - run npm run build');
}

// Summary and final validation report
console.log('\n' + '='.repeat(60));
console.log('📊 Validation Summary');
console.log('=' .repeat(60));

console.log(`✅ Passed: ${validation.passed}`);
console.log(`❌ Failed: ${validation.failed}`);
console.log(`⚠️  Warnings: ${validation.warnings}`);

if (validation.failed === 0) {
    console.log('\n🎉 All critical validations passed!');
    console.log('\n📋 Production Readiness Status: READY');
    
    if (validation.warnings > 0) {
        console.log('\n⚠️  Note: Some warnings were found. Review them for optimal setup.');
    }
    
    console.log('\n🚀 Next Steps for Production Deployment:');
    console.log('1. Package VS Code extension: npm run build-extension');
    console.log('2. Install extension in target VS Code instances');
    console.log('3. Configure Teams authentication in production environment');
    console.log('4. Test with: @teams /schedule meeting with someone@company.com');
    console.log('5. Monitor logs for any runtime issues');
    
} else {
    console.log('\n❌ Validation failed. Issues must be resolved before production deployment.');
    console.log('\n🔧 Issues to resolve:');
    validation.errors.forEach(error => {
        console.log(`   • ${error}`);
    });
    
    console.log('\n📚 For troubleshooting, see SETUP.md and GITHUB-COPILOT-INTEGRATION.md');
    process.exit(1);
}

console.log('\n📚 Documentation: GITHUB-COPILOT-INTEGRATION.md');
console.log('🛠️  Support: Check SETUP.md for configuration details');