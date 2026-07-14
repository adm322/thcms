#!/bin/sh
set -e

echo "=== TrainHub Docker Entrypoint ==="

# Ensure DB directory exists
mkdir -p /app/db

# Apply pending migrations idempotently. Unlike `db push`, this is safe in
# production: it only runs migrations that haven't been applied yet, and
# refuses to drop or reset data.
echo "Running prisma migrate deploy..."
npx prisma migrate deploy 2>&1 || {
  echo "ERROR: prisma migrate deploy failed"
  exit 1
}

echo "Starting Next.js server..."
exec node .next/standalone/server.js
