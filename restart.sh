#!/bin/bash
# Auto-restart script for Pharma CI
# Kills old processes and starts fresh
cd /home/z/my-project

# Kill existing processes
pkill -f "next-server" 2>/dev/null
pkill -f "next dev" 2>/dev/null
pkill -f "bun.*dev" 2>/dev/null
pkill -f "node.*server.js" 2>/dev/null
sleep 1

# Start fresh with setsid for process isolation
setsid bash -c 'exec bun run dev > /home/z/my-project/dev.log 2>&1' & disown
sleep 4

# Verify
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
echo "$(date) - Restart: HTTP $STATUS" >> /home/z/my-project/restart.log
