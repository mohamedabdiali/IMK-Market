FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package manifests first for efficient caching
COPY package.json package-lock.json* ./
COPY pnpm-lock.yaml* ./

# Install dependencies (including devDeps because we rely on `tsx` at runtime)
RUN npm ci --silent

# Copy source
COPY . .

# Build front-end (if any)
RUN npm run build || true

# Use a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /usr/src/app

USER appuser

ENV NODE_ENV=production
EXPOSE 5050

# Start server (uses `server:start` which runs `tsx server/index.ts`)
CMD ["npm", "run", "start"]
