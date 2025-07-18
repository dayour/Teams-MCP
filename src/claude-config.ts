#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Claude Desktop Configuration Generator
 * 
 * Automatically configures Claude Desktop to use the Teams MCP server
 */
class ClaudeConfigGenerator {
    private static getClaudeConfigPath(): string | null {
        const platform = os.platform();
        const homedir = os.homedir();
        
        let configPath: string;
        
        switch (platform) {
            case 'win32':
                configPath = path.join(homedir, 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json');
                break;
            case 'darwin':
                configPath = path.join(homedir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
                break;
            case 'linux':
                configPath = path.join(homedir, '.config', 'claude', 'claude_desktop_config.json');
                break;
            default:
                return null;
        }
        
        // Create directory if it doesn't exist
        const configDir = path.dirname(configPath);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        
        return configPath;
    }

    static configure(serverPath?: string): boolean {
        const configPath = this.getClaudeConfigPath();
        
        if (!configPath) {
            console.error('❌ Unsupported platform for Claude Desktop configuration');
            return false;
        }

        try {
            // Read existing config or create new one
            let config: any = {};
            
            if (fs.existsSync(configPath)) {
                const content = fs.readFileSync(configPath, 'utf8');
                config = JSON.parse(content);
            }

            // Ensure mcpServers object exists
            if (!config.mcpServers) {
                config.mcpServers = {};
            }

            // Determine server path
            const mcpServerPath = serverPath || path.resolve(__dirname, 'mcp-server.js');

            // Add Teams MCP server configuration
            config.mcpServers['teams-mcp'] = {
                command: 'node',
                args: [mcpServerPath]
            };

            // Write updated config
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            
            console.log('✅ Claude Desktop configuration updated successfully!');
            console.log(`📁 Config file: ${configPath}`);
            console.log('🔄 Please restart Claude Desktop to use Teams MCP');
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to update Claude Desktop configuration:', error);
            return false;
        }
    }

    static showStatus(): void {
        const configPath = this.getClaudeConfigPath();
        
        if (!configPath) {
            console.log('❌ Unsupported platform');
            return;
        }

        if (!fs.existsSync(configPath)) {
            console.log('❌ Claude Desktop config not found');
            console.log(`Expected location: ${configPath}`);
            return;
        }

        try {
            const content = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(content);
            
            if (config.mcpServers && config.mcpServers['teams-mcp']) {
                console.log('✅ Teams MCP is configured in Claude Desktop');
                console.log(`📁 Config: ${configPath}`);
                console.log(`🚀 Server: ${config.mcpServers['teams-mcp'].command} ${config.mcpServers['teams-mcp'].args.join(' ')}`);
            } else {
                console.log('❌ Teams MCP not found in Claude Desktop config');
                console.log(`📁 Config: ${configPath}`);
            }
            
        } catch (error) {
            console.error('❌ Failed to read Claude Desktop configuration:', error);
        }
    }

    static remove(): boolean {
        const configPath = this.getClaudeConfigPath();
        
        if (!configPath || !fs.existsSync(configPath)) {
            console.log('❌ Claude Desktop config not found');
            return false;
        }

        try {
            const content = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(content);
            
            if (config.mcpServers && config.mcpServers['teams-mcp']) {
                delete config.mcpServers['teams-mcp'];
                
                // Remove mcpServers if empty
                if (Object.keys(config.mcpServers).length === 0) {
                    delete config.mcpServers;
                }
                
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                console.log('✅ Teams MCP removed from Claude Desktop configuration');
                return true;
            } else {
                console.log('ℹ️  Teams MCP was not configured in Claude Desktop');
                return true;
            }
            
        } catch (error) {
            console.error('❌ Failed to update Claude Desktop configuration:', error);
            return false;
        }
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'configure';

    switch (command) {
        case 'configure':
        case 'config':
            const serverPath = args[1];
            ClaudeConfigGenerator.configure(serverPath);
            break;
            
        case 'status':
        case 'check':
            ClaudeConfigGenerator.showStatus();
            break;
            
        case 'remove':
        case 'uninstall':
            ClaudeConfigGenerator.remove();
            break;
            
        default:
            console.log(`
Claude Desktop Configuration Tool for Teams MCP

Usage:
  claude-config configure [server-path]  - Configure Claude Desktop
  claude-config status                   - Check configuration status  
  claude-config remove                   - Remove Teams MCP configuration

Examples:
  node claude-config.js configure
  node claude-config.js status
  node claude-config.js remove
            `);
            break;
    }
}

// Export for use in extension
export { ClaudeConfigGenerator };

// Run CLI if called directly
if (require.main === module) {
    main().catch(console.error);
}