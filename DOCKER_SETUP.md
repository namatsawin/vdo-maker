# 🐳 Docker Setup Guide

## Quick Start

### 1. Prerequisites
- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit with your API keys (optional for development)
# GEMINI_API_KEY=your-key-here
# PIAPI_API_KEY=your-key-here
```

### 3. Start the Application
```bash
# Option 1: Use the startup script
./start.sh

# Option 2: Manual Docker Compose
docker-compose up --build -d
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

### 5. Stop the Application
```bash
# Option 1: Use the stop script
./stop.sh

# Option 2: Manual Docker Compose
docker-compose down
```

## Docker Compose Files

### Development (`docker-compose.yml`)
- Hot reload enabled for both frontend and backend
- Volume mounting for live code changes
- Development environment variables
- SQLite database with persistent volume

### Production (`docker-compose.prod.yml`)
- Optimized builds with multi-stage Dockerfiles
- Nginx for frontend serving
- Production environment variables
- Health checks and restart policies

## Available Commands

```bash
# Development
docker-compose up -d                    # Start services
docker-compose down                     # Stop services
docker-compose logs -f                  # View logs
docker-compose logs -f backend          # View backend logs only
docker-compose restart backend          # Restart backend service

# Production
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml down

# Maintenance
docker-compose build --no-cache         # Rebuild all images
docker-compose down -v                  # Stop and remove volumes
docker system prune                     # Clean up unused Docker resources
```

## Service Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │
│   React + Vite  │◄──►│   Node.js       │
│   Port: 5173    │    │   Port: 3001    │
└─────────────────┘    └─────────────────┘
         │                       │
         │              ┌─────────────────┐
         │              │   SQLite DB     │
         │              │   (Volume)      │
         │              └─────────────────┘
         │
┌─────────────────┐
│   File Storage  │
│   (Volume)      │
└─────────────────┘
```

## Environment Variables

### Backend Service
- `NODE_ENV`: development/production
- `DATABASE_URL`: SQLite database path
- `JWT_SECRET`: JWT signing secret
- `GEMINI_API_KEY`: Google Gemini AI API key
- `PIAPI_API_KEY`: PiAPI (Kling AI) API key

### Frontend Service
- `VITE_API_URL`: Backend API URL

## Volumes

- `backend-uploads`: Persistent file storage
- `backend-db`: SQLite database persistence

## Networking

- Custom bridge network: `vdo-maker-network`
- Services communicate via service names
- Frontend proxies API calls to backend

## Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using the ports
   lsof -i :5173
   lsof -i :3001
   ```

2. **Permission issues**
   ```bash
   # Fix file permissions
   chmod +x start.sh stop.sh
   ```

3. **Database issues**
   ```bash
   # Reset database
   docker-compose down -v
   docker-compose up -d
   ```

4. **Build cache issues**
   ```bash
   # Clean rebuild
   docker-compose build --no-cache
   docker-compose up -d
   ```

### Logs and Debugging

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Execute commands in running containers
docker-compose exec backend sh
docker-compose exec frontend sh

# Check service status
docker-compose ps
```

## Production Deployment

For production deployment:

1. Use `docker-compose.prod.yml`
2. Set proper environment variables
3. Configure reverse proxy (nginx/traefik)
4. Set up SSL certificates
5. Configure monitoring and logging

```bash
# Production deployment
export JWT_SECRET="your-secure-secret"
export GEMINI_API_KEY="your-api-key"
export PIAPI_API_KEY="your-api-key"

docker-compose -f docker-compose.prod.yml up -d
```

## Development Workflow

1. **Code Changes**: Edit files locally
2. **Hot Reload**: Changes automatically reflected
3. **Database Changes**: Run migrations in container
4. **Testing**: Use container environment
5. **Debugging**: Access container shells

```bash
# Run database migrations
docker-compose exec backend npx prisma migrate dev

# Access database
docker-compose exec backend npx prisma studio

# Install new dependencies
docker-compose exec backend npm install package-name
docker-compose restart backend
```
