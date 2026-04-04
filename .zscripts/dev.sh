#!/bin/bash
# Custom dev script for Pharma CI - Production mode for maximum stability
# This script is called by the container's start.sh on boot
set -e

cd /home/z/my-project

echo "[DEV] Installing dependencies..."
bun install --no-progress 2>&1 | tail -3

echo "[DEV] Setting up database..."
if [ -f "prisma/schema.prisma" ]; then
  bunx prisma db push --skip-generate --accept-data-loss 2>&1 | tail -3
  bunx prisma generate 2>&1 | tail -3
fi

echo "[DEV] Building for production..."
NODE_ENV=production npx next build 2>&1 | tail -5

# Copy static assets to standalone
cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
cp -r public .next/standalone/ 2>/dev/null || true

echo "[DEV] Starting production server on port 3000..."
NODE_ENV=production node .next/standalone/server.js &

# Save PID for monitoring
echo $! > /home/z/my-project/.zscripts/dev.pid

# Wait for server to be ready
for i in $(seq 1 30); do
  if curl -s --connect-timeout 2 --max-time 3 http://localhost:3000 > /dev/null 2>&1; then
    echo "[DEV] Server is ready on port 3000 (PID: $(cat /home/z/my-project/.zscripts/dev.pid))!"
    exit 0
  fi
  sleep 1
done

echo "[DEV] WARNING: Server check timed out, but process may still be starting..."
exit 0
