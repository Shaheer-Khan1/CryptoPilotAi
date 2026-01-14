# Use Node.js LTS version as base image
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Copy any other necessary files (like shared schema if needed at runtime)
COPY --from=builder /app/shared ./shared

# Create uploads directory structure for file uploads
RUN mkdir -p uploads/videos uploads/metadata

# Expose port 3000
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Run the production server
CMD ["npm", "start"]

