/**
 * Logger utility for Teams MCP
 * Production-ready logging with different levels and formats
 */

export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}

export class Logger {
    private static instance: Logger;
    private logLevel: LogLevel;
    private enableConsole: boolean;
    private enableFile: boolean;

    private constructor() {
        // Determine log level from environment or default to INFO
        const envLevel = process.env.LOG_LEVEL?.toUpperCase();
        this.logLevel = this.parseLogLevel(envLevel) || LogLevel.INFO;
        
        this.enableConsole = process.env.LOG_CONSOLE !== 'false';
        this.enableFile = process.env.LOG_FILE === 'true';
    }

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private parseLogLevel(level?: string): LogLevel | null {
        switch (level) {
            case 'ERROR': return LogLevel.ERROR;
            case 'WARN': return LogLevel.WARN;
            case 'INFO': return LogLevel.INFO;
            case 'DEBUG': return LogLevel.DEBUG;
            default: return null;
        }
    }

    private formatMessage(level: string, message: string, context?: any): string {
        const timestamp = new Date().toISOString();
        const contextStr = context ? ` ${JSON.stringify(context)}` : '';
        return `[${timestamp}] [${level}] ${message}${contextStr}`;
    }

    error(message: string, error?: Error | unknown, context?: any): void {
        if (this.logLevel >= LogLevel.ERROR) {
            const formattedMsg = this.formatMessage('ERROR', message, context);
            
            if (this.enableConsole) {
                console.error(formattedMsg);
                if (error instanceof Error) {
                    console.error('Stack:', error.stack);
                } else if (error) {
                    console.error('Error details:', error);
                }
            }
        }
    }

    warn(message: string, context?: any): void {
        if (this.logLevel >= LogLevel.WARN) {
            const formattedMsg = this.formatMessage('WARN', message, context);
            
            if (this.enableConsole) {
                console.warn(formattedMsg);
            }
        }
    }

    info(message: string, context?: any): void {
        if (this.logLevel >= LogLevel.INFO) {
            const formattedMsg = this.formatMessage('INFO', message, context);
            
            if (this.enableConsole) {
                console.log(formattedMsg);
            }
        }
    }

    debug(message: string, context?: any): void {
        if (this.logLevel >= LogLevel.DEBUG) {
            const formattedMsg = this.formatMessage('DEBUG', message, context);
            
            if (this.enableConsole) {
                console.log(formattedMsg);
            }
        }
    }

    /**
     * Log a tool execution
     */
    logToolExecution(toolName: string, args: any, duration?: number): void {
        const context = {
            tool: toolName,
            args: args,
            duration: duration ? `${duration}ms` : undefined
        };
        this.info(`Tool executed: ${toolName}`, context);
    }

    /**
     * Log API calls to Microsoft Graph
     */
    logGraphAPICall(endpoint: string, method: string, success: boolean, duration?: number): void {
        const context = {
            endpoint,
            method,
            success,
            duration: duration ? `${duration}ms` : undefined
        };
        
        if (success) {
            this.debug(`Graph API call: ${method} ${endpoint}`, context);
        } else {
            this.warn(`Graph API call failed: ${method} ${endpoint}`, context);
        }
    }

    /**
     * Log authentication events
     */
    logAuthEvent(event: string, details?: any): void {
        this.info(`Authentication event: ${event}`, details);
    }

    /**
     * Set log level dynamically
     */
    setLogLevel(level: LogLevel): void {
        this.logLevel = level;
    }

    /**
     * Get current log level
     */
    getLogLevel(): LogLevel {
        return this.logLevel;
    }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience functions
export const log = {
    error: (msg: string, error?: Error | unknown, ctx?: any) => logger.error(msg, error, ctx),
    warn: (msg: string, ctx?: any) => logger.warn(msg, ctx),
    info: (msg: string, ctx?: any) => logger.info(msg, ctx),
    debug: (msg: string, ctx?: any) => logger.debug(msg, ctx),
    toolExecution: (tool: string, args: any, duration?: number) => logger.logToolExecution(tool, args, duration),
    graphAPI: (endpoint: string, method: string, success: boolean, duration?: number) => 
        logger.logGraphAPICall(endpoint, method, success, duration),
    auth: (event: string, details?: any) => logger.logAuthEvent(event, details)
};
