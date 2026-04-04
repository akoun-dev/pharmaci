#!/bin/bash
# Keep-alive watchdog: checks every 30 seconds, restarts if down
while true; do
    if ! curl -s -o /dev/null -w "" http://localhost:3000/ 2>/dev/null; then
        echo "$(date): Server down, restarting..." >> /home/z/my-project/watchdog.log
        pkill -f "node.*server.js" 2>/dev/null
        sleep 1
        cd /home/z/my-project && NODE_ENV=production nohup node .next/standalone/server.js > server.log 2>&1 &
        sleep 2
        echo "$(date): Server restarted" >> /home/z/my-project/watchdog.log
    fi
    sleep 30
done
