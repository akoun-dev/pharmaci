#!/bin/bash
pkill -f "next-server" 2>/dev/null
cd /home/z/my-project
NODE_ENV=production node .next/standalone/server.js &
