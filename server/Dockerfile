# Backend Dockerfile
FROM node:20-alpine

# Update package index and install OpenSSL for Prisma
# FFmpeg installation is optional for MVP - can be added later
RUN apk update && apk add --no-cache openssl

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

# Create organized upload directory structure
RUN mkdir -p uploads/images uploads/videos uploads/audios uploads/others uploads/merged logs temp

# Set proper permissions for upload directories
RUN chmod -R 755 uploads logs temp

# Expose port
EXPOSE 3001

# Start the application with Prisma client regeneration
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run dev"]
