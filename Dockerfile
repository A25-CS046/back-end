# ================================
# Production Dockerfile for Google Cloud Run
# ================================

# Use lightweight Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy package files first (for better Docker layer caching)
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose the port (Cloud Run uses PORT env variable)
EXPOSE 8080

# Run as non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

USER nodejs

# Start the application
CMD ["node", "src/server.js"]
