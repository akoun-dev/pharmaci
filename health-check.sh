#!/bin/bash
# Ultra-lightweight health check + restart
# Runs via cron every 5 min to keep server alive
cd /home/z/my-project

# Check if server responds
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)

if [ "$STATUS" != "200" ]; then
    echo "$(date): Server DOWN (HTTP $STATUS), restarting..." >> /home/z/my-project/health.log
    
    # Kill any leftover processes
    pkill -f "next dev" 2>/dev/null
    pkill -f "node.*server.js" 2>/dev/null
    sleep 1
    
    # Restart in background
    nohup bun run dev > dev.log 2>&1 &
    sleep 3
    
    NEW_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
    echo "$(date): Restarted - HTTP $NEW_STATUS" >> /home/z/my-project/health.log
fi
