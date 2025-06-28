# Backend Dockerfile
FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Create necessary directories
RUN mkdir -p uploads logs

# Expose port
EXPOSE 3001

# Start the application
CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]
