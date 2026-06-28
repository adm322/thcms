FROM node:22-alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies with npm (flat node_modules, no pnpm symlink issues)
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN npm install --legacy-peer-deps 2>/dev/null || npm install

# Copy source code
COPY . .

# Generate Prisma Client (SQLite mode for Docker/local builds)
ENV DATABASE_URL=file:./db/dev.db
RUN npx prisma generate

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
RUN node prisma/prepare-db.js && npx prisma generate && npx next build --webpack

# Prune devDependencies to reduce image size
RUN npm prune --production

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
ENV PORT=3000

ENTRYPOINT ["./docker-entrypoint.sh"]
