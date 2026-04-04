#!/bin/bash
# Ultra-fast keepalive wrapper for Pharma CI
# Restarts the production server within 1 second of crash

cd /home/z/my-project

while true; do
  NODE_ENV=production node .next/standalone/server.js &
  CHILD_PID=$!
  wait $CHILD_PID 2>/dev/null
  # Server crashed, restart immediately (no sleep)
done
