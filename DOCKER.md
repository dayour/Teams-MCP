# Docker Deployment Guide

This guide explains how to deploy Teams MCP using Docker for production environments.

## Quick Start

### Using Docker Compose (Recommended)

1. **Create environment file**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Build and start**:
   ```bash
   docker-compose up -d
   ```

3. **Check logs**:
   ```bash
   docker-compose logs -f teams-mcp
   ```

4. **Stop**:
   ```bash
   docker-compose down
   ```

### Using Docker directly

1. **Build the image**:
   ```bash
   docker build -t teams-mcp:latest .
   ```

2. **Run the container**:
   ```bash
   docker run -d \
     --name teams-mcp \
     -p 3978:3978 \
     -e DEVICE_CODE_CLIENT_ID=14d82eec-204b-4c2f-b7e8-296a70dab67e \
     -v teams-mcp-tokens:/home/appuser/.teams-mcp \
     teams-mcp:latest
   ```

3. **View logs**:
   ```bash
   docker logs -f teams-mcp
   ```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DEVICE_CODE_CLIENT_ID` | Microsoft client ID for device auth | `14d82eec-204b-4c2f-b7e8-296a70dab67e` | Yes |
| `CLIENT_ID` | Azure app client ID (if using app registration) | - | No |
| `CLIENT_SECRET` | Azure app secret | - | No |
| `TENANT_ID` | Azure tenant ID | - | No |
| `PORT` | Server port | `3978` | No |
| `NODE_ENV` | Environment (development/production) | `production` | No |
| `LOG_LEVEL` | Logging level (ERROR/WARN/INFO/DEBUG) | `INFO` | No |

### Volume Mounts

- `/home/appuser/.teams-mcp`: Stores authentication tokens persistently

## Authentication in Docker

Since Docker containers run in isolation, authentication requires special handling:

### Option 1: Pre-authenticate on Host

1. Authenticate on your host machine:
   ```bash
   npm run auth
   ```

2. Mount the token directory:
   ```bash
   docker run -d \
     --name teams-mcp \
     -v ~/.teams-mcp:/home/appuser/.teams-mcp \
     teams-mcp:latest
   ```

### Option 2: Interactive Authentication

1. Start container in interactive mode:
   ```bash
   docker run -it --rm \
     -v teams-mcp-tokens:/home/appuser/.teams-mcp \
     teams-mcp:latest \
     node lib/auth-helper.js auth
   ```

2. Follow the device code flow prompts

3. Start the server normally:
   ```bash
   docker-compose up -d
   ```

## Production Deployment

### Security Best Practices

1. **Use secrets management**:
   - Don't store credentials in .env files in production
   - Use Docker secrets or external secret managers
   - Example with Docker Swarm:
     ```yaml
     secrets:
       client_secret:
         external: true
     services:
       teams-mcp:
         secrets:
           - client_secret
     ```

2. **Run as non-root**:
   - The Dockerfile already configures a non-root user
   - Never override with `--user root`

3. **Network isolation**:
   - Use Docker networks to isolate the container
   - Don't expose unnecessary ports

4. **Resource limits**:
   - Set memory and CPU limits (already configured in docker-compose.yml)
   - Monitor resource usage

### Health Monitoring

The container includes a health check:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' teams-mcp

# View health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' teams-mcp
```

### Logging

Logs are managed by Docker's logging driver:

```bash
# View logs
docker-compose logs -f teams-mcp

# Export logs
docker-compose logs teams-mcp > teams-mcp.log
```

Configure logging in docker-compose.yml:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## Scaling

### Multiple Instances

To run multiple instances (e.g., for different tenants):

```bash
# Instance 1
docker run -d --name teams-mcp-tenant1 \
  -p 3978:3978 \
  -e TENANT_ID=tenant1-id \
  teams-mcp:latest

# Instance 2
docker run -d --name teams-mcp-tenant2 \
  -p 3979:3978 \
  -e TENANT_ID=tenant2-id \
  teams-mcp:latest
```

### Kubernetes Deployment

Example Kubernetes deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: teams-mcp
spec:
  replicas: 1
  selector:
    matchLabels:
      app: teams-mcp
  template:
    metadata:
      labels:
        app: teams-mcp
    spec:
      containers:
      - name: teams-mcp
        image: teams-mcp:latest
        ports:
        - containerPort: 3978
        env:
        - name: DEVICE_CODE_CLIENT_ID
          valueFrom:
            secretKeyRef:
              name: teams-mcp-secrets
              key: client-id
        volumeMounts:
        - name: token-cache
          mountPath: /home/appuser/.teams-mcp
        resources:
          limits:
            memory: "512Mi"
            cpu: "1000m"
          requests:
            memory: "256Mi"
            cpu: "500m"
      volumes:
      - name: token-cache
        persistentVolumeClaim:
          claimName: teams-mcp-pvc
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs teams-mcp

# Verify environment variables
docker exec teams-mcp env

# Check file permissions
docker exec teams-mcp ls -la /home/appuser/.teams-mcp
```

### Authentication issues

```bash
# Clear token cache
docker exec teams-mcp rm -rf /home/appuser/.teams-mcp/*

# Re-authenticate
docker exec -it teams-mcp node lib/auth-helper.js auth
```

### Performance issues

```bash
# Check resource usage
docker stats teams-mcp

# Increase resource limits in docker-compose.yml
```

## Updating

### Update the container

```bash
# Pull latest code
git pull

# Rebuild image
docker-compose build

# Restart with new image
docker-compose up -d
```

### Zero-downtime updates

```bash
# Start new container
docker-compose up -d --no-deps --scale teams-mcp=2 teams-mcp

# Wait for health check
sleep 30

# Remove old container
docker-compose up -d --no-deps --scale teams-mcp=1 teams-mcp
```

## Backup and Recovery

### Backup authentication tokens

```bash
# Backup volume
docker run --rm \
  -v teams-mcp-tokens:/source \
  -v $(pwd):/backup \
  alpine tar czf /backup/teams-mcp-tokens-backup.tar.gz -C /source .
```

### Restore authentication tokens

```bash
# Restore volume
docker run --rm \
  -v teams-mcp-tokens:/target \
  -v $(pwd):/backup \
  alpine tar xzf /backup/teams-mcp-tokens-backup.tar.gz -C /target
```

## Support

For issues or questions:
- [Report Issues](https://github.com/dayour/Teams-MCP/issues)
- [Discussions](https://github.com/dayour/Teams-MCP/discussions)
