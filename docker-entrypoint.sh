#!/bin/sh
set -e

echo "=== TrainHub Docker Entrypoint ==="

# Ensure DB directory exists
mkdir -p /app/db

# Push schema to create tables (idempotent)
echo "Running prisma db push..."
npx prisma db push --accept-data-loss 2>&1 || echo "⚠ WARNING: prisma db push had errors (may be OK if tables already exist)"

echo "Starting Next.js server..."
exec node .next/standalone/server.js
