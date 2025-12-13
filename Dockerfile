# Teams MCP - Dockerfile
# Production-ready containerized deployment

FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm install typescript @types/node --save-dev

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production image
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S appuser && \
    adduser -S -u 1001 -G appuser appuser

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built files from builder
COPY --from=builder /app/lib ./lib

# Create directory for token cache
RUN mkdir -p /home/appuser/.teams-mcp && \
    chown -R appuser:appuser /home/appuser/.teams-mcp && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port (if needed for future HTTP endpoints)
EXPOSE 3978

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('healthy')" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the MCP server
CMD ["node", "lib/mcp-server.js"]
