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

# Copy Prisma schema first (to ensure it's always fresh)
COPY prisma ./prisma

# Generate Prisma client with the schema
RUN npx prisma generate

# Copy the rest of the source code
COPY . .

# Regenerate Prisma client to ensure it's using the latest schema
RUN npx prisma generate

# Create necessary directories
RUN mkdir -p uploads logs

# Expose port
EXPOSE 3001

# Start the application
CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]
