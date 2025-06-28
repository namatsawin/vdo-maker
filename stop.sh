#!/bin/bash

# VDO Maker - Docker Stop Script

echo "🛑 Stopping VDO Maker services..."

# Stop and remove containers
docker-compose down

echo "✅ Services stopped successfully!"

# Optional: Remove volumes (uncomment if you want to reset data)
# echo "🗑️  Removing volumes..."
# docker-compose down -v

echo "📋 To restart: ./start.sh or docker-compose up -d"
