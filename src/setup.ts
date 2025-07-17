#!/usr/bin/env node

/**
 * Teams MCP Installation and Setup Script
 * 
 * Automates the installation and configuration process for Teams MCP
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawn, exec } from 'child_process';
import { DeviceAuthHelper } from './auth-helper.js';
import { ClaudeConfigGenerator } from './claude-config.js';

class TeamsMCPInstaller {
    private verbose: boolean;

    constructor(verbose: boolean = false) {
        this.verbose = verbose;
    }

    private log(message: string) {
        console.log(message);
    }

    private debug(message: string) {
        if (this.verbose) {
            console.log(`[DEBUG] ${message}`);
        }
    }

    private async runCommand(command: string, cwd?: string): Promise<string> {
        return new Promise((resolve, reject) => {
            exec(command, { cwd }, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stdout.trim());
                }
            });
        });
    }

    async install(): Promise<void> {
        this.log('🚀 Teams MCP Installation Starting...\n');

        try {
            // Step 1: Check prerequisites
            await this.checkPrerequisites();

            // Step 2: Build the project
            await this.buildProject();

            // Step 3: Set up authentication
            await this.setupAuthentication();

            // Step 4: Configure Claude Desktop
            await this.configureClaudeDesktop();

            // Step 5: Test installation
            await this.testInstallation();

            this.log('\n🎉 Teams MCP Installation Complete!');
            this.log('\n📖 Next Steps:');
            this.log('1. Restart Claude Desktop');
            this.log('2. Start chatting with Teams MCP capabilities!');
            this.log('\n💡 Example: "Schedule a meeting with john@company.com tomorrow at 2 PM"');

        } catch (error) {
            this.log(`\n❌ Installation failed: ${error instanceof Error ? error.message : String(error)}`);
            process.exit(1);
        }
    }

    private async checkPrerequisites(): Promise<void> {
        this.log('🔍 Checking prerequisites...');

        // Check Node.js version
        try {
            const nodeVersion = await this.runCommand('node --version');
            const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
            if (majorVersion < 16) {
                throw new Error(`Node.js 16+ required, found ${nodeVersion}`);
            }
            this.debug(`Node.js version: ${nodeVersion} ✓`);
        } catch (error) {
            throw new Error('Node.js not found. Please install Node.js 16+');
        }

        // Check npm
        try {
            const npmVersion = await this.runCommand('npm --version');
            this.debug(`npm version: ${npmVersion} ✓`);
        } catch (error) {
            throw new Error('npm not found. Please install npm');
        }

        // Check if packages are installed
        if (!fs.existsSync('node_modules')) {
            this.log('📦 Installing dependencies...');
            await this.runCommand('npm install');
        }

        this.log('✅ Prerequisites check passed\n');
    }

    private async buildProject(): Promise<void> {
        this.log('🔨 Building Teams MCP...');

        try {
            await this.runCommand('npm run build');
            this.log('✅ Build completed\n');
        } catch (error) {
            throw new Error('Build failed. Please check for TypeScript errors.');
        }
    }

    private async setupAuthentication(): Promise<void> {
        this.log('🔐 Setting up authentication...');

        const authHelper = new DeviceAuthHelper();
        
        // Check if already authenticated
        const existingToken = await authHelper.getStoredToken();
        if (existingToken) {
            this.log('✅ Existing authentication found');
            return;
        }

        this.log('\n🔑 Starting device authentication flow...');
        this.log('You will be prompted to sign in to Microsoft.');

        try {
            await authHelper.authenticate();
            this.log('✅ Authentication completed\n');
        } catch (error) {
            throw new Error(`Authentication failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private async configureClaudeDesktop(): Promise<void> {
        this.log('⚙️  Configuring Claude Desktop...');

        try {
            const serverPath = path.resolve('lib/mcp-server.js');
            const success = ClaudeConfigGenerator.configure(serverPath);
            
            if (success) {
                this.log('✅ Claude Desktop configured\n');
            } else {
                this.log('⚠️  Could not automatically configure Claude Desktop');
                this.log('Please configure manually or restart Claude Desktop\n');
            }
        } catch (error) {
            this.log('⚠️  Claude Desktop configuration failed (this is optional)\n');
        }
    }

    private async testInstallation(): Promise<void> {
        this.log('🧪 Testing installation...');

        try {
            // Test MCP server initialization
            await this.runCommand('node lib/test-mcp.js');
            this.log('✅ Teams MCP server test passed\n');
        } catch (error) {
            throw new Error('Installation test failed. Please check the logs above.');
        }
    }

    async uninstall(): Promise<void> {
        this.log('🗑️  Uninstalling Teams MCP...');

        try {
            // Clear authentication
            const authHelper = new DeviceAuthHelper();
            await authHelper.clearCache();

            // Remove Claude Desktop configuration
            ClaudeConfigGenerator.remove();

            this.log('✅ Teams MCP uninstalled successfully');
        } catch (error) {
            this.log(`⚠️  Uninstall warning: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async status(): Promise<void> {
        this.log('📊 Teams MCP Status\n');

        // Check authentication
        try {
            const authHelper = new DeviceAuthHelper();
            const token = await authHelper.getStoredToken();
            this.log(`🔐 Authentication: ${token ? '✅ Configured' : '❌ Not configured'}`);
        } catch (error) {
            this.log('🔐 Authentication: ❌ Error checking');
        }

        // Check build
        const buildExists = fs.existsSync('lib/mcp-server.js');
        this.log(`🔨 Build: ${buildExists ? '✅ Ready' : '❌ Not built'}`);

        // Check Claude Desktop config
        this.log('\n⚙️  Claude Desktop Configuration:');
        ClaudeConfigGenerator.showStatus();

        // Check dependencies
        const nodeModulesExists = fs.existsSync('node_modules');
        this.log(`\n📦 Dependencies: ${nodeModulesExists ? '✅ Installed' : '❌ Not installed'}`);
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'install';
    const verbose = args.includes('--verbose') || args.includes('-v');

    const installer = new TeamsMCPInstaller(verbose);

    switch (command) {
        case 'install':
        case 'setup':
            await installer.install();
            break;

        case 'uninstall':
        case 'remove':
            await installer.uninstall();
            break;

        case 'status':
        case 'check':
            await installer.status();
            break;

        case 'help':
        case '--help':
        case '-h':
            console.log(`
Teams MCP Installation Tool

Usage:
  node setup.js [command] [options]

Commands:
  install       Install and configure Teams MCP (default)
  uninstall     Remove Teams MCP configuration
  status        Check installation status
  help          Show this help message

Options:
  --verbose, -v Show detailed output

Examples:
  node setup.js install --verbose
  node setup.js status
  node setup.js uninstall
            `);
            break;

        default:
            console.error(`Unknown command: ${command}`);
            console.log('Run "node setup.js help" for usage information');
            process.exit(1);
    }
}

// Export for use in extension
export { TeamsMCPInstaller };

// Run CLI if called directly
if (require.main === module) {
    main().catch(console.error);
}