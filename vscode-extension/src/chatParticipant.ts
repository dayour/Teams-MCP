import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';

/**
 * GitHub Copilot Chat Participant for Teams MCP
 * 
 * This class implements a chat participant that integrates Microsoft Teams
 * scheduling and calendar capabilities with GitHub Copilot. It wraps the
 * Teams MCP server and translates between Copilot's chat interface and
 * the MCP protocol.
 */
export class TeamsChatParticipant {
    private participant: vscode.ChatParticipant | null = null;
    private mcpProcess: ChildProcess | null = null;
    private isServerReady = false;

    constructor(private context: vscode.ExtensionContext) {}

    /**
     * Registers the Teams chat participant with GitHub Copilot
     */
    public register() {
        try {
            // Register the Teams chat participant for GitHub Copilot
            this.participant = vscode.chat.createChatParticipant('teams', this.handleChatRequest.bind(this));
            
            // Set participant metadata
            this.participant.iconPath = new vscode.ThemeIcon('organization');
            this.participant.followupProvider = {
                provideFollowups: this.provideFollowups.bind(this)
            };

            console.log('Teams chat participant registered successfully');
        } catch (error) {
            console.error('Failed to register Teams chat participant:', error);
            vscode.window.showErrorMessage(
                'Failed to register Teams chat participant. GitHub Copilot may not be available.'
            );
        }
    }

    /**
     * Handles incoming chat requests from GitHub Copilot
     */
    private async handleChatRequest(
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        response: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<vscode.ChatResult> {
        try {
            // Ensure MCP server is running
            if (!this.isServerReady) {
                await this.ensureMcpServer();
            }

            // Parse the request
            const command = request.command || 'schedule';
            const query = request.prompt.trim();

            if (!query) {
                response.markdown(this.getHelpMessage());
                return { metadata: { success: true } };
            }

            // Map chat commands to MCP tools
            const toolMap: { [key: string]: string } = {
                'schedule': 'schedule_meeting',
                'availability': 'check_availability', 
                'calendar': 'get_my_calendar',
                'rooms': 'find_available_rooms',
                'cancel': 'cancel_meeting',
                'update': 'update_meeting'
            };

            const mcpTool = toolMap[command] || 'schedule_meeting';

            // Show progress
            response.progress('Processing your Teams request...');

            // Call the MCP server
            const result = await this.callMcpTool(mcpTool, query, command);
            
            // Stream the response
            if (result.success) {
                response.markdown(`✅ **${this.getCommandDisplayName(command)}**\n\n${result.message}`);
            } else {
                response.markdown(`❌ **Error**: ${result.message}`);
            }

            return { metadata: { success: result.success } };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            response.markdown(`❌ **Error**: ${errorMessage}`);
            return { metadata: { success: false } };
        }
    }

    /**
     * Provides follow-up suggestions for the chat
     */
    private provideFollowups(
        result: vscode.ChatResult,
        context: vscode.ChatContext,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.ChatFollowup[]> {
        if (!result.metadata?.success) {
            return [];
        }

        return [
            {
                prompt: '/teams schedule a meeting for tomorrow at 2pm',
                label: '📅 Schedule meeting',
                command: 'schedule'
            },
            {
                prompt: '/teams availability check availability for john@company.com',
                label: '🔍 Check availability',
                command: 'availability'
            },
            {
                prompt: '/teams calendar show my calendar for today',
                label: '📆 View calendar',
                command: 'calendar'
            },
            {
                prompt: '/teams rooms find rooms for 10 people tomorrow 2-3pm',
                label: '🏢 Find rooms',
                command: 'rooms'
            }
        ];
    }

    /**
     * Ensures the MCP server is running and ready
     */
    private async ensureMcpServer(): Promise<void> {
        if (this.isServerReady && this.mcpProcess) {
            return;
        }

        try {
            await this.startMcpServer();
            this.isServerReady = true;
        } catch (error) {
            throw new Error(`Failed to start MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Starts the Teams MCP server process
     */
    private async startMcpServer(): Promise<void> {
        const serverPath = path.join(__dirname, '../../lib/mcp-server.js');
        
        // Set up environment variables
        const env = { ...process.env };
        
        // Check configuration for auth method
        const config = vscode.workspace.getConfiguration('teamsMcp');
        if (!config.get('useDeviceAuth')) {
            env.CLIENT_ID = await this.context.secrets.get('teams-mcp-client-id') || '';
            env.CLIENT_SECRET = await this.context.secrets.get('teams-mcp-client-secret') || '';
            env.TENANT_ID = await this.context.secrets.get('teams-mcp-tenant-id') || '';
        } else {
            // Use device code flow
            env.DEVICE_CODE_CLIENT_ID = '14d82eec-204b-4c2f-b7e8-296a70dab67e';
        }

        this.mcpProcess = spawn(process.execPath, [serverPath], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env
        });

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('MCP server startup timeout'));
            }, 10000);

            let hasStarted = false;

            this.mcpProcess!.stdout!.on('data', (data) => {
                const output = data.toString();
                if (output.includes('Teams MCP Server running') && !hasStarted) {
                    hasStarted = true;
                    clearTimeout(timeout);
                    resolve();
                }
            });

            this.mcpProcess!.stderr!.on('data', (data) => {
                console.error('MCP Server Error:', data.toString());
            });

            this.mcpProcess!.on('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });

            this.mcpProcess!.on('exit', (code) => {
                this.isServerReady = false;
                this.mcpProcess = null;
                if (code !== 0 && !hasStarted) {
                    clearTimeout(timeout);
                    reject(new Error(`MCP server exited with code ${code}`));
                }
            });
        });
    }

    /**
     * Calls an MCP tool with the given parameters
     */
    private async callMcpTool(tool: string, query: string, command: string): Promise<{success: boolean, message: string}> {
        try {
            // Parse natural language query based on command
            const params = this.parseQueryForTool(tool, query);
            
            // For now, return a formatted response indicating what would be called
            // In a full implementation, this would use the MCP protocol to communicate with the server
            const response = this.simulateToolCall(tool, params, query);
            
            return {
                success: true,
                message: response
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to call MCP tool'
            };
        }
    }

    /**
     * Parses natural language query into structured parameters for MCP tools
     */
    private parseQueryForTool(tool: string, query: string): any {
        // This is a simplified parser - in a full implementation, this would use
        // more sophisticated NLP to extract structured data from natural language
        
        const lowerQuery = query.toLowerCase();
        
        switch (tool) {
            case 'schedule_meeting':
                return {
                    subject: this.extractMeetingSubject(query),
                    attendees: this.extractEmails(query),
                    datetime: this.extractDateTime(query),
                    location: this.extractLocation(query)
                };
            
            case 'check_availability':
                return {
                    attendees: this.extractEmails(query),
                    timeRange: this.extractDateTime(query)
                };
            
            case 'find_available_rooms':
                return {
                    datetime: this.extractDateTime(query),
                    capacity: this.extractCapacity(query)
                };
            
            default:
                return { query };
        }
    }

    /**
     * Simulates tool calls for demonstration purposes
     */
    private simulateToolCall(tool: string, params: any, originalQuery: string): string {
        switch (tool) {
            case 'schedule_meeting':
                return `Meeting scheduled: "${params.subject || 'New Meeting'}"\n` +
                       `📅 Time: ${params.datetime || 'Not specified'}\n` +
                       `👥 Attendees: ${params.attendees?.join(', ') || 'None specified'}\n` +
                       `📍 Location: ${params.location || 'Teams meeting'}\n\n` +
                       `*Note: This is a demonstration. Actual meeting creation requires authentication.*`;
            
            case 'check_availability':
                return `Availability check for: ${params.attendees?.join(', ') || 'specified attendees'}\n` +
                       `📅 Time range: ${params.timeRange || 'specified time'}\n\n` +
                       `✅ Available slots found:\n` +
                       `• 9:00 AM - 10:00 AM\n` +
                       `• 2:00 PM - 3:00 PM\n` +
                       `• 4:00 PM - 5:00 PM\n\n` +
                       `*Note: This is sample data. Actual availability requires authentication.*`;
            
            case 'get_my_calendar':
                return `📆 **Your Calendar**\n\n` +
                       `**Today's Events:**\n` +
                       `• 9:00 AM - Team Standup\n` +
                       `• 11:00 AM - Project Review\n` +
                       `• 2:00 PM - Client Call\n\n` +
                       `*Note: This is sample data. Actual calendar requires authentication.*`;
            
            case 'find_available_rooms':
                return `🏢 **Available Rooms**\n\n` +
                       `**Conference Room A** (Capacity: ${params.capacity || 8})\n` +
                       `• 📺 TV Display\n` +
                       `• 📞 Conference Phone\n\n` +
                       `**Conference Room B** (Capacity: ${params.capacity || 12})\n` +
                       `• 📺 TV Display\n` +
                       `• 🎥 Video Conferencing\n\n` +
                       `*Note: This is sample data. Actual room booking requires authentication.*`;
            
            default:
                return `Tool "${tool}" would be called with query: "${originalQuery}"\n\n` +
                       `*This feature requires proper authentication and MCP server integration.*`;
        }
    }

    /**
     * Helper methods for parsing natural language
     */
    private extractMeetingSubject(query: string): string {
        // Simple extraction - look for quoted text or text after "meeting about/for"
        const quotedMatch = query.match(/"([^"]+)"/);
        if (quotedMatch) return quotedMatch[1];
        
        const aboutMatch = query.match(/meeting (?:about|for|regarding) (.+?)(?:\s+with|\s+at|\s+on|$)/i);
        if (aboutMatch) return aboutMatch[1];
        
        return 'New Meeting';
    }

    private extractEmails(query: string): string[] {
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        return query.match(emailRegex) || [];
    }

    private extractDateTime(query: string): string {
        // Simple datetime extraction - this would be more sophisticated in practice
        const timeMatches = [
            /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))/gi,
            /\b(tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi,
            /\b(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/g
        ];
        
        const found = [];
        for (const regex of timeMatches) {
            const matches = query.match(regex);
            if (matches) found.push(...matches);
        }
        
        return found.join(' ') || 'Not specified';
    }

    private extractLocation(query: string): string {
        const locationMatch = query.match(/(?:in|at) (.+?)(?:\s+with|\s+at|\s+on|$)/i);
        return locationMatch?.[1] || '';
    }

    private extractCapacity(query: string): number {
        const capacityMatch = query.match(/(\d+)\s*(?:people|persons|attendees)/i);
        return capacityMatch ? parseInt(capacityMatch[1]) : 8;
    }

    /**
     * Gets display name for commands
     */
    private getCommandDisplayName(command: string): string {
        const names: { [key: string]: string } = {
            'schedule': 'Schedule Meeting',
            'availability': 'Check Availability',
            'calendar': 'View Calendar', 
            'rooms': 'Find Rooms',
            'cancel': 'Cancel Meeting',
            'update': 'Update Meeting'
        };
        return names[command] || 'Teams Action';
    }

    /**
     * Returns help message for the chat participant
     */
    private getHelpMessage(): string {
        return `## 🎯 Teams MCP - Microsoft Teams Integration

I can help you with Microsoft Teams calendar and meeting management:

### Available Commands:
- \`/teams schedule\` - Schedule a new meeting
- \`/teams availability\` - Check attendee availability  
- \`/teams calendar\` - View your calendar
- \`/teams rooms\` - Find available meeting rooms
- \`/teams cancel\` - Cancel a meeting
- \`/teams update\` - Update a meeting

### Example Usage:
- \`/teams schedule meeting with john@company.com tomorrow at 2pm\`
- \`/teams availability check john@company.com and jane@company.com for tomorrow\`
- \`/teams calendar show today's events\`
- \`/teams rooms find room for 10 people tomorrow 2-3pm\`

**Note**: Authentication is required for actual Teams operations. Use the Teams MCP commands in the Command Palette to configure.`;
    }

    /**
     * Disposes of the chat participant and cleans up resources
     */
    public dispose() {
        if (this.participant) {
            this.participant.dispose();
        }
        if (this.mcpProcess) {
            this.mcpProcess.kill();
        }
    }
}