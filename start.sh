#!/bin/bash

# VDO Maker - Docker Startup Script

echo "🚀 Starting VDO Maker AI Video Generation Platform..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install Docker Compose."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f server/.env ]; then
    echo "📝 Creating server/.env file from template..."
    cp server/.env.example server/.env
    echo "⚠️  Please edit server/.env with your API keys before running in production!"
fi

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are running!"
    echo ""
    echo "🌐 Frontend: http://localhost:5173"
    echo "🔧 Backend API: http://localhost:3001"
    echo "🏥 Health Check: http://localhost:3001/health"
    echo ""
    echo "📋 To view logs: docker-compose logs -f"
    echo "🛑 To stop: docker-compose down"
else
    echo "❌ Failed to start services. Check logs with: docker-compose logs"
    exit 1
fi
