# Microsoft Facilitator Agent Integration

Teams MCP Server includes built-in support for Microsoft's Facilitator Agent platform and Windows 11 On-device Agent Registry (ODR), enabling secure, governed agent-to-agent communication.

## Overview

The facilitator agent integration provides:

- **Agent Discovery Metadata**: Export ODR-compatible discovery information
- **Security & Governance**: Built-in audit logging and authorization checks
- **Tool-Level Permissions**: Granular permission mapping for each MCP tool
- **Identity Validation**: Secure agent-to-agent communication with identity verification
- **Monitoring & Observability**: Execution statistics and audit trails

## Quick Start

### View Agent Metadata

```bash
npm run facilitator metadata
```

This displays the agent's capabilities, permissions, security baseline, and endpoints.

### Export Discovery Information

```bash
npm run facilitator export > teams-mcp-discovery.json
```

This generates an ODR-compatible JSON file that can be used to register the agent with Windows 11.

### View Execution Statistics

```bash
npm run facilitator stats
```

Shows execution statistics including success rate, average duration, and audit information.

## Windows 11 ODR Registration

To register Teams MCP Server with Windows 11 On-device Agent Registry:

1. **Export Discovery Metadata**:
   ```bash
   npm run facilitator export > teams-mcp-discovery.json
   ```

2. **Register with ODR** (requires administrator privileges):
   ```bash
   odr.exe register teams-mcp-discovery.json
   ```

3. **Verify Registration**:
   ```bash
   odr.exe list
   ```

## Agent Capabilities

The Teams MCP Server exposes the following capabilities to Microsoft's agentic platform:

### Calendar Management
- **schedule_meeting**: Schedule new meetings with Teams links
- **update_meeting**: Modify existing meetings
- **cancel_meeting**: Cancel meetings
- **get_my_calendar**: Retrieve calendar events

### Availability & Scheduling
- **check_availability**: Check attendee availability
- **resolve_conflicts**: Find alternative meeting times

### Room Management
- **find_available_rooms**: Search for meeting rooms by capacity and equipment

## Security & Governance

### Authentication
- **Method**: Device Code Flow (MSAL)
- **Provider**: Microsoft Azure AD
- **Scope**: User-delegated permissions

### Authorization
All tool executions are logged with:
- Agent ID
- User ID (when available)
- Tenant ID (when available)
- Timestamp
- Tool name and parameters
- Execution result (success/failure)
- Duration

### Audit Logging

The facilitator agent maintains an audit trail of all tool executions:

```typescript
{
  timestamp: "2026-01-01T12:00:00.000Z",
  agentId: "teams-mcp-server",
  userId: "user@company.com",
  tenantId: "tenant-id",
  operation: "tool_execution",
  toolName: "schedule_meeting",
  parameters: { ... },
  result: "success",
  duration: 1250
}
```

### Required Permissions

The agent requires the following Microsoft Graph permissions:

| Permission | Type | Scope |
|------------|------|-------|
| Calendar.ReadWrite | Delegated | Create, read, update, and delete calendar events |
| Calendars.Read.Shared | Delegated | Read shared calendars for availability |
| Place.Read.All | Delegated | Read room information |
| User.Read | Delegated | Read user profile |

## Environment Variables

Configure the facilitator agent using environment variables:

```bash
# Agent identification
AGENT_ID=teams-mcp-server
TENANT_ID=your-tenant-id
USER_ID=user@company.com

# Security settings
LOG_LEVEL=INFO
LOG_CONSOLE=true

# Microsoft Graph authentication
DEVICE_CODE_CLIENT_ID=your-client-id
```

## Agent-to-Agent Communication

When another agent invokes Teams MCP Server tools, the system:

1. **Validates Agent Identity**: Checks agent ID and timestamp
2. **Verifies Authorization**: Ensures required permissions are granted
3. **Executes Tool**: Performs the requested operation
4. **Logs Execution**: Records the operation in the audit trail
5. **Returns Result**: Provides structured response with success/failure indication

### Example Agent Communication Flow

```
Agent A (Copilot) → Teams MCP Server
  ↓
1. Identity Validation
2. Permission Check
3. Tool Execution (schedule_meeting)
4. Audit Logging
  ↓
Response → Agent A
```

## Integration with Microsoft Ecosystem

### Azure AI Foundry
Teams MCP Server can be registered with Azure AI Foundry for enterprise-wide agent orchestration.

### Dynamics 365
Connect with Dynamics 365 workflows through agent connectors.

### Copilot Studio
Use as a backend service for custom Copilot agents.

### Windows 11 Agentic OS
Register with ODR for seamless Windows 11 agent integration.

## Monitoring & Observability

### Execution Statistics

The facilitator agent tracks:
- Total executions
- Success/failure rates
- Unauthorized attempts
- Average execution duration

Access via:
```bash
npm run facilitator stats
```

### Audit Trail Query

Programmatically access audit logs:

```typescript
import { facilitatorAgent } from './facilitator-agent.js';

// Get all logs
const logs = facilitatorAgent.getAuditLog();

// Filter by agent
const agentLogs = facilitatorAgent.getAuditLog({
  agentId: 'copilot-agent-1'
});

// Filter by date range
const recentLogs = facilitatorAgent.getAuditLog({
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-01-02')
});
```

## Best Practices

### Security
1. **Use Device Code Flow**: Recommended for user-facing scenarios
2. **Enable Audit Logging**: Always keep audit logs enabled for compliance
3. **Validate Identities**: Let the system validate agent identities
4. **Monitor Access**: Regularly review audit logs for unauthorized attempts

### Performance
1. **Monitor Duration**: Track average execution duration
2. **Handle Failures**: Implement retry logic for transient failures
3. **Cache Results**: Consider caching frequent queries

### Compliance
1. **Review Audit Logs**: Regular audit log reviews for compliance
2. **Permission Management**: Ensure minimal required permissions
3. **Data Retention**: Configure appropriate log retention policies

## Troubleshooting

### ODR Registration Fails
- Ensure you have administrator privileges
- Verify the discovery JSON is valid
- Check Windows 11 version (requires Feature Update with ODR support)

### Agent Identity Validation Fails
- Check timestamp is within acceptable range (±5 minutes)
- Verify agent ID is properly set
- Ensure system clock is synchronized

### Audit Logs Not Recording
- Check LOG_LEVEL environment variable
- Verify facilitator agent is initialized
- Ensure write permissions for log storage

## API Reference

### FacilitatorAgentIntegration Class

```typescript
// Get metadata
const metadata = facilitatorAgent.getMetadata();

// Validate identity
const isValid = facilitatorAgent.validateIdentity({
  agentId: 'agent-1',
  timestamp: new Date().toISOString()
});

// Check authorization
const authorized = facilitatorAgent.checkAuthorization({
  identity: { ... },
  requiredPermissions: ['Calendar.ReadWrite'],
  grantedPermissions: ['Calendar.ReadWrite', 'User.Read']
});

// Log execution
facilitatorAgent.logExecution({
  timestamp: new Date().toISOString(),
  agentId: 'agent-1',
  operation: 'tool_execution',
  toolName: 'schedule_meeting',
  parameters: { ... },
  result: 'success',
  duration: 1000
});

// Get statistics
const stats = facilitatorAgent.getStatistics();

// Export discovery info
const discoveryJson = facilitatorAgent.exportDiscoveryInfo();
```

## Resources

- [Microsoft MCP Overview](https://learn.microsoft.com/en-us/windows/ai/mcp/overview)
- [Windows 11 ODR Documentation](https://learn.microsoft.com/en-us/windows/ai/mcp/register)
- [Azure AI Foundry MCP Integration](https://learn.microsoft.com/en-us/azure/ai-foundry/mcp)
- [Model Context Protocol Specification](https://modelcontextprotocol.io)

## Support

For issues or questions about facilitator agent integration:
- [Report Issues](https://github.com/dayour/Teams-MCP/issues)
- [Discussions](https://github.com/dayour/Teams-MCP/discussions)
- [Microsoft Learn Community](https://learn.microsoft.com/answers/)

---

**Built for Microsoft's Agentic Computing Platform**

Transform your AI agents with secure, governed Microsoft Teams integration.
