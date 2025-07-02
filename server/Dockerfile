# Backend Dockerfile
FROM node:20-alpine

# Install OpenSSL for Prisma and FFmpeg for video processing
RUN apk add --no-cache openssl ffmpeg

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy Prisma schema first (to ensure it's always fresh)
COPY prisma ./prisma

# Generate Prisma client with the schema
RUN npx prisma generate

# Copy the rest of the source code
COPY . .

# Create necessary directories
RUN mkdir -p uploads logs uploads/merged temp

# Expose port
EXPOSE 3001

# Start the application with Prisma client regeneration
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run dev"]
