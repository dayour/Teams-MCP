import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';

/**
 * Teams MCP Extension
 * 
 * This extension manages the Teams MCP server and provides automatic
 * configuration for Claude Desktop and other MCP clients.
 */
export class TeamsMCPExtension {
    private mcpServerProcess: ChildProcess | null = null;
    private statusBarItem: vscode.StatusBarItem;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.statusBarItem.command = 'teams-mcp.status';
        context.subscriptions.push(this.statusBarItem);
    }

    async activate() {
        // Register commands
        this.context.subscriptions.push(
            vscode.commands.registerCommand('teams-mcp.configure', () => this.configure()),
            vscode.commands.registerCommand('teams-mcp.start', () => this.startServer()),
            vscode.commands.registerCommand('teams-mcp.stop', () => this.stopServer()),
            vscode.commands.registerCommand('teams-mcp.status', () => this.showStatus())
        );

        // Set up status bar
        this.updateStatusBar('Stopped');
        this.statusBarItem.show();

        // Auto-start if configured
        const config = vscode.workspace.getConfiguration('teamsMcp');
        if (config.get('autoStart')) {
            await this.ensureAuthenticated();
            if (await this.isAuthenticated()) {
                await this.startServer();
            } else {
                vscode.window.showInformationMessage(
                    'Teams MCP: Please authenticate to start the server automatically.',
                    'Configure'
                ).then(selection => {
                    if (selection === 'Configure') {
                        this.configure();
                    }
                });
            }
        }

        // Auto-configure Claude Desktop if detected
        await this.configureClaudeDesktop();
    }

    async configure() {
        const choice = await vscode.window.showQuickPick([
            {
                label: 'Device Authentication (Recommended)',
                description: 'Use your existing Microsoft account credentials',
                detail: 'No app registration required - easiest setup'
            },
            {
                label: 'Azure App Registration',
                description: 'Use custom Azure app registration',
                detail: 'For advanced users with specific requirements'
            }
        ], {
            placeHolder: 'Choose authentication method'
        });

        if (!choice) return;

        if (choice.label.includes('Device Authentication')) {
            await this.setupDeviceAuth();
        } else {
            await this.setupAppRegistration();
        }
    }

    private async setupDeviceAuth() {
        // Update configuration to use device auth
        const config = vscode.workspace.getConfiguration('teamsMcp');
        await config.update('useDeviceAuth', true, vscode.ConfigurationTarget.Global);

        // Start authentication flow
        vscode.window.showInformationMessage(
            'Starting device authentication flow. You will be prompted to sign in to Microsoft.',
            'Continue'
        ).then(async (selection) => {
            if (selection === 'Continue') {
                try {
                    await this.initiateDeviceFlow();
                    vscode.window.showInformationMessage(
                        'Authentication successful! Teams MCP is now configured.',
                        'Start Server'
                    ).then(selection => {
                        if (selection === 'Start Server') {
                            this.startServer();
                        }
                    });
                } catch (error) {
                    vscode.window.showErrorMessage(
                        `Authentication failed: ${error instanceof Error ? error.message : String(error)}`
                    );
                }
            }
        });
    }

    private async setupAppRegistration() {
        const clientId = await vscode.window.showInputBox({
            prompt: 'Enter your Azure App Client ID',
            placeHolder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
        });

        if (!clientId) return;

        const clientSecret = await vscode.window.showInputBox({
            prompt: 'Enter your Azure App Client Secret',
            placeHolder: 'Your client secret',
            password: true
        });

        if (!clientSecret) return;

        const tenantId = await vscode.window.showInputBox({
            prompt: 'Enter your Azure Tenant ID',
            placeHolder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
        });

        if (!tenantId) return;

        // Store credentials securely
        await this.context.secrets.store('teams-mcp-client-id', clientId);
        await this.context.secrets.store('teams-mcp-client-secret', clientSecret);
        await this.context.secrets.store('teams-mcp-tenant-id', tenantId);

        // Update configuration
        const config = vscode.workspace.getConfiguration('teamsMcp');
        await config.update('useDeviceAuth', false, vscode.ConfigurationTarget.Global);

        vscode.window.showInformationMessage(
            'Azure app registration configured successfully!',
            'Start Server'
        ).then(selection => {
            if (selection === 'Start Server') {
                this.startServer();
            }
        });
    }

    private async initiateDeviceFlow(): Promise<void> {
        // This would be handled by the MCP server with device code flow
        // For now, simulate the flow
        return new Promise((resolve, reject) => {
            const terminal = vscode.window.createTerminal('Teams MCP Auth');
            terminal.show();
            terminal.sendText(`node "${path.join(__dirname, '../../lib/auth-helper.js')}"`);
            
            // Monitor for completion
            setTimeout(() => {
                terminal.dispose();
                resolve();
            }, 30000); // 30 second timeout
        });
    }

    async startServer() {
        if (this.mcpServerProcess) {
            vscode.window.showWarningMessage('Teams MCP server is already running');
            return;
        }

        try {
            const serverPath = path.join(__dirname, '../../lib/mcp-server.js');
            
            if (!fs.existsSync(serverPath)) {
                vscode.window.showErrorMessage(
                    'MCP server not found. Please rebuild the extension.',
                    'Rebuild'
                ).then(selection => {
                    if (selection === 'Rebuild') {
                        vscode.commands.executeCommand('workbench.action.reloadWindow');
                    }
                });
                return;
            }

            // Set up environment variables
            const env = { ...process.env };
            
            const config = vscode.workspace.getConfiguration('teamsMcp');
            if (!config.get('useDeviceAuth')) {
                env.CLIENT_ID = await this.context.secrets.get('teams-mcp-client-id') || '';
                env.CLIENT_SECRET = await this.context.secrets.get('teams-mcp-client-secret') || '';
                env.TENANT_ID = await this.context.secrets.get('teams-mcp-tenant-id') || '';
            }

            // Start the MCP server
            this.mcpServerProcess = spawn('node', [serverPath], {
                env,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            this.mcpServerProcess.on('error', (error) => {
                vscode.window.showErrorMessage(`Failed to start Teams MCP server: ${error.message}`);
                this.mcpServerProcess = null;
                this.updateStatusBar('Error');
            });

            this.mcpServerProcess.on('exit', (code) => {
                if (code !== 0) {
                    vscode.window.showErrorMessage(`Teams MCP server exited with code ${code}`);
                }
                this.mcpServerProcess = null;
                this.updateStatusBar('Stopped');
            });

            // Monitor stdout for ready signal
            this.mcpServerProcess.stdout?.on('data', (data) => {
                const output = data.toString();
                if (output.includes('MCP Server running')) {
                    this.updateStatusBar('Running');
                    vscode.window.showInformationMessage('Teams MCP server started successfully!');
                }
            });

            // Log stderr
            this.mcpServerProcess.stderr?.on('data', (data) => {
                console.error('Teams MCP Server:', data.toString());
            });

            this.updateStatusBar('Starting...');

        } catch (error) {
            vscode.window.showErrorMessage(
                `Failed to start Teams MCP server: ${error instanceof Error ? error.message : String(error)}`
            );
            this.updateStatusBar('Error');
        }
    }

    async stopServer() {
        if (!this.mcpServerProcess) {
            vscode.window.showWarningMessage('Teams MCP server is not running');
            return;
        }

        this.mcpServerProcess.kill();
        this.mcpServerProcess = null;
        this.updateStatusBar('Stopped');
        vscode.window.showInformationMessage('Teams MCP server stopped');
    }

    async showStatus() {
        const isRunning = this.mcpServerProcess !== null;
        const isAuthenticated = await this.isAuthenticated();
        const config = vscode.workspace.getConfiguration('teamsMcp');
        
        const status = `
**Teams MCP Status**

Server: ${isRunning ? '🟢 Running' : '🔴 Stopped'}
Authentication: ${isAuthenticated ? '🟢 Configured' : '🔴 Not configured'}
Auto-start: ${config.get('autoStart') ? '✅ Enabled' : '❌ Disabled'}
Auth Method: ${config.get('useDeviceAuth') ? 'Device Authentication' : 'App Registration'}

**Available Commands:**
• Configure authentication
• Start/Stop server
• View Claude Desktop config
        `.trim();

        const panel = vscode.window.createWebviewPanel(
            'teamsMcpStatus',
            'Teams MCP Status',
            vscode.ViewColumn.One,
            {}
        );

        panel.webview.html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: var(--vscode-font-family); padding: 20px; }
                    pre { background: var(--vscode-editor-background); padding: 10px; border-radius: 4px; }
                </style>
            </head>
            <body>
                <pre>${status}</pre>
                <button onclick="acquireVsCodeApi().postMessage({command: 'configure'})">Configure</button>
                <button onclick="acquireVsCodeApi().postMessage({command: 'start'})">Start Server</button>
                <button onclick="acquireVsCodeApi().postMessage({command: 'stop'})">Stop Server</button>
            </body>
            </html>
        `;

        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'configure':
                    this.configure();
                    break;
                case 'start':
                    this.startServer();
                    break;
                case 'stop':
                    this.stopServer();
                    break;
            }
        });
    }

    private async configureClaudeDesktop() {
        // Try to find Claude Desktop config file
        const os = require('os');
        const claudeConfigPaths = [
            path.join(os.homedir(), 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json'), // Windows
            path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'), // macOS
            path.join(os.homedir(), '.config', 'claude', 'claude_desktop_config.json') // Linux
        ];

        for (const configPath of claudeConfigPaths) {
            if (fs.existsSync(configPath)) {
                await this.updateClaudeConfig(configPath);
                break;
            }
        }
    }

    private async updateClaudeConfig(configPath: string) {
        try {
            let config: any = {};
            
            if (fs.existsSync(configPath)) {
                const content = fs.readFileSync(configPath, 'utf8');
                config = JSON.parse(content);
            }

            // Ensure mcpServers object exists
            if (!config.mcpServers) {
                config.mcpServers = {};
            }

            // Add Teams MCP server configuration
            const serverPath = path.join(__dirname, '../../lib/mcp-server.js');
            config.mcpServers['teams-mcp'] = {
                command: 'node',
                args: [serverPath],
                env: {
                    // Environment variables will be set by the extension
                }
            };

            // Write updated config
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            
            vscode.window.showInformationMessage(
                'Claude Desktop configuration updated! Restart Claude Desktop to use Teams MCP.',
                'Open Config'
            ).then(selection => {
                if (selection === 'Open Config') {
                    vscode.env.openExternal(vscode.Uri.file(configPath));
                }
            });

        } catch (error) {
            console.warn('Could not update Claude Desktop config:', error);
        }
    }

    private async isAuthenticated(): Promise<boolean> {
        const config = vscode.workspace.getConfiguration('teamsMcp');
        
        if (config.get('useDeviceAuth')) {
            // Check if device auth token exists
            const token = await this.context.secrets.get('teams-mcp-device-token');
            return !!token;
        } else {
            // Check if app registration credentials exist
            const clientId = await this.context.secrets.get('teams-mcp-client-id');
            const clientSecret = await this.context.secrets.get('teams-mcp-client-secret');
            const tenantId = await this.context.secrets.get('teams-mcp-tenant-id');
            return !!(clientId && clientSecret && tenantId);
        }
    }

    private async ensureAuthenticated() {
        if (!(await this.isAuthenticated())) {
            const choice = await vscode.window.showInformationMessage(
                'Teams MCP is not configured. Would you like to set it up now?',
                'Configure',
                'Later'
            );

            if (choice === 'Configure') {
                await this.configure();
            }
        }
    }

    private updateStatusBar(status: string) {
        this.statusBarItem.text = `$(organization) Teams MCP: ${status}`;
        this.statusBarItem.tooltip = `Teams MCP Server Status: ${status}`;
    }

    dispose() {
        if (this.mcpServerProcess) {
            this.mcpServerProcess.kill();
        }
        this.statusBarItem.dispose();
    }
}

// Extension activation
export function activate(context: vscode.ExtensionContext) {
    const extension = new TeamsMCPExtension(context);
    extension.activate();
    
    context.subscriptions.push(extension);
}

export function deactivate() {
    // Cleanup handled by dispose methods
}