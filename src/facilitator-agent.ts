/**
 * Microsoft Facilitator Agent Integration
 * 
 * This module provides enhanced MCP capabilities for Microsoft's agentic computing platform.
 * It enables agent-to-agent communication and supports Windows 11 ODR (On-device Agent Registry)
 * integration for secure, governed AI agent interactions.
 * 
 * Key Features:
 * - Agent discovery metadata for ODR registration
 * - Enhanced security with identity and authorization context
 * - Agent-to-agent communication support
 * - Audit logging for governance
 * - Tool-level authorization metadata
 * 
 * References:
 * - https://learn.microsoft.com/en-us/windows/ai/mcp/overview
 * - Model Context Protocol specification
 */

import { z } from 'zod';
import { log } from './utils/logger.js';

/**
 * Agent identity information for secure communication
 */
export interface AgentIdentity {
  agentId: string;
  tenantId?: string;
  userId?: string;
  timestamp: string;
}

/**
 * Authorization context for tool execution
 */
export interface AuthorizationContext {
  identity: AgentIdentity;
  requiredPermissions: string[];
  grantedPermissions: string[];
}

/**
 * Facilitator agent metadata for ODR registration
 */
export interface FacilitatorAgentMetadata {
  name: string;
  version: string;
  description: string;
  capabilities: {
    calendar: boolean;
    meetings: boolean;
    rooms: boolean;
    availability: boolean;
  };
  requiredPermissions: string[];
  securityBaseline: {
    authentication: 'msal' | 'device-code' | 'oauth';
    authorization: 'user-delegated' | 'app-only';
    auditLogging: boolean;
    encryption: boolean;
  };
  endpoints: {
    mcp: {
      transport: 'stdio' | 'http' | 'sse';
      protocol: 'mcp-1.0';
    };
  };
}

/**
 * Audit log entry for governance and compliance
 */
export interface AuditLogEntry {
  timestamp: string;
  agentId: string;
  userId?: string;
  tenantId?: string;
  operation: string;
  toolName: string;
  parameters: Record<string, any>;
  result: 'success' | 'failure' | 'unauthorized';
  error?: string;
  duration?: number;
}

/**
 * Microsoft Facilitator Agent Integration
 * 
 * Provides enhanced MCP server capabilities for Microsoft's agentic computing platform,
 * including ODR registration, security, and governance features.
 */
export class FacilitatorAgentIntegration {
  private metadata: FacilitatorAgentMetadata;
  private auditLog: AuditLogEntry[] = [];
  private maxAuditLogSize: number = 1000;

  constructor() {
    this.metadata = this.initializeMetadata();
    log.info('Facilitator Agent Integration initialized', {
      agent: this.metadata.name,
      version: this.metadata.version
    });
  }

  /**
   * Initialize agent metadata for ODR registration
   */
  private initializeMetadata(): FacilitatorAgentMetadata {
    return {
      name: 'teams-mcp-server',
      version: '1.1.0',
      description: 'Microsoft Teams MCP Server - Calendar, Meeting, and Room Management for AI Agents',
      capabilities: {
        calendar: true,
        meetings: true,
        rooms: true,
        availability: true
      },
      requiredPermissions: [
        'Calendar.ReadWrite',
        'Calendars.Read.Shared',
        'Place.Read.All',
        'User.Read'
      ],
      securityBaseline: {
        authentication: 'device-code',
        authorization: 'user-delegated',
        auditLogging: true,
        encryption: true
      },
      endpoints: {
        mcp: {
          transport: 'stdio',
          protocol: 'mcp-1.0'
        }
      }
    };
  }

  /**
   * Get agent metadata for ODR registration
   */
  getMetadata(): FacilitatorAgentMetadata {
    return this.metadata;
  }

  /**
   * Validate agent identity for secure communication
   */
  validateIdentity(identity: AgentIdentity): boolean {
    try {
      // Basic validation
      if (!identity.agentId || !identity.timestamp) {
        log.warn('Invalid agent identity: missing required fields', { identity });
        return false;
      }

      // Validate timestamp is recent (within 5 minutes)
      const timestamp = new Date(identity.timestamp);
      const now = new Date();
      const diffMinutes = (now.getTime() - timestamp.getTime()) / (1000 * 60);
      
      if (diffMinutes > 5 || diffMinutes < -1) {
        log.warn('Invalid agent identity: timestamp out of acceptable range', { 
          identity,
          diffMinutes 
        });
        return false;
      }

      log.debug('Agent identity validated', { agentId: identity.agentId });
      return true;
    } catch (error) {
      log.error('Error validating agent identity', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * Check authorization for tool execution
   */
  checkAuthorization(context: AuthorizationContext): boolean {
    try {
      // Validate identity first
      if (!this.validateIdentity(context.identity)) {
        return false;
      }

      // Check if all required permissions are granted
      const hasAllPermissions = context.requiredPermissions.every(
        required => context.grantedPermissions.includes(required)
      );

      if (!hasAllPermissions) {
        log.warn('Authorization failed: missing required permissions', {
          agentId: context.identity.agentId,
          required: context.requiredPermissions,
          granted: context.grantedPermissions
        });
        return false;
      }

      log.debug('Authorization successful', { agentId: context.identity.agentId });
      return true;
    } catch (error) {
      log.error('Error checking authorization', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * Log tool execution for audit trail
   */
  logExecution(entry: AuditLogEntry): void {
    try {
      // Add to audit log
      this.auditLog.push(entry);

      // Trim log if it exceeds max size
      if (this.auditLog.length > this.maxAuditLogSize) {
        this.auditLog = this.auditLog.slice(-this.maxAuditLogSize);
      }

      // Log to system logger
      const logLevel = entry.result === 'success' ? 'info' : 'warn';
      log[logLevel]('Tool execution logged', {
        agentId: entry.agentId,
        operation: entry.operation,
        toolName: entry.toolName,
        result: entry.result,
        duration: entry.duration
      });
    } catch (error) {
      log.error('Error logging execution', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get audit log entries for governance reporting
   */
  getAuditLog(filter?: {
    agentId?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): AuditLogEntry[] {
    try {
      let filteredLog = [...this.auditLog];

      if (filter) {
        if (filter.agentId) {
          filteredLog = filteredLog.filter(entry => entry.agentId === filter.agentId);
        }
        if (filter.userId) {
          filteredLog = filteredLog.filter(entry => entry.userId === filter.userId);
        }
        if (filter.startDate) {
          filteredLog = filteredLog.filter(entry => 
            new Date(entry.timestamp) >= filter.startDate!
          );
        }
        if (filter.endDate) {
          filteredLog = filteredLog.filter(entry => 
            new Date(entry.timestamp) <= filter.endDate!
          );
        }
      }

      return filteredLog;
    } catch (error) {
      log.error('Error getting audit log', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  /**
   * Export agent discovery information for ODR registration
   * This can be used with Windows 11 ODR (odr.exe) for agent registration
   */
  exportDiscoveryInfo(): string {
    const discoveryInfo = {
      apiVersion: 'mcp/v1',
      kind: 'MCPServer',
      metadata: {
        name: this.metadata.name,
        version: this.metadata.version,
        description: this.metadata.description
      },
      spec: {
        capabilities: this.metadata.capabilities,
        permissions: {
          required: this.metadata.requiredPermissions
        },
        security: this.metadata.securityBaseline,
        endpoints: this.metadata.endpoints,
        tools: [
          {
            name: 'schedule_meeting',
            category: 'calendar',
            permissions: ['Calendar.ReadWrite']
          },
          {
            name: 'check_availability',
            category: 'calendar',
            permissions: ['Calendars.Read.Shared']
          },
          {
            name: 'find_available_rooms',
            category: 'rooms',
            permissions: ['Place.Read.All']
          },
          {
            name: 'cancel_meeting',
            category: 'calendar',
            permissions: ['Calendar.ReadWrite']
          },
          {
            name: 'update_meeting',
            category: 'calendar',
            permissions: ['Calendar.ReadWrite']
          },
          {
            name: 'get_my_calendar',
            category: 'calendar',
            permissions: ['Calendar.ReadWrite']
          },
          {
            name: 'resolve_conflicts',
            category: 'calendar',
            permissions: ['Calendar.ReadWrite', 'Calendars.Read.Shared']
          }
        ]
      }
    };

    return JSON.stringify(discoveryInfo, null, 2);
  }

  /**
   * Get statistics for monitoring and observability
   */
  getStatistics(): {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    unauthorizedAttempts: number;
    averageDuration: number;
  } {
    const total = this.auditLog.length;
    const successful = this.auditLog.filter(e => e.result === 'success').length;
    const failed = this.auditLog.filter(e => e.result === 'failure').length;
    const unauthorized = this.auditLog.filter(e => e.result === 'unauthorized').length;
    
    const durationsWithValues = this.auditLog
      .filter(e => e.duration !== undefined)
      .map(e => e.duration!);
    
    const averageDuration = durationsWithValues.length > 0
      ? durationsWithValues.reduce((sum, d) => sum + d, 0) / durationsWithValues.length
      : 0;

    return {
      totalExecutions: total,
      successfulExecutions: successful,
      failedExecutions: failed,
      unauthorizedAttempts: unauthorized,
      averageDuration: Math.round(averageDuration)
    };
  }
}

// Singleton instance for use across the application
export const facilitatorAgent = new FacilitatorAgentIntegration();
