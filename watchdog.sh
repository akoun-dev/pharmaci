#!/bin/bash
if ! ss -tlnp | grep -q ":3000.*LISTEN"; then
  pkill -f "next-server" 2>/dev/null
  sleep 1
  cd /home/z/my-project
  NODE_ENV=production node .next/standalone/server.js > server.log 2>&1 &
  echo "$(date): Server restarted" >> /home/z/my-project/dev.log
fi
