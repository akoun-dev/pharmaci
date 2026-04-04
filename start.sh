#!/bin/bash
cd /home/z/my-project
while true; do
  echo "Starting dev server..."
  npx next dev --turbopack -p 3000 2>&1 | tee -a /home/z/my-project/dev.log
  echo "Server died, restarting in 3s..."
  sleep 3
done
