#!/bin/bash
cd /home/z/my-project
while true; do
  echo "=== Starting dev server at $(date) ===" >> /home/z/my-project/server.log
  bun run dev >> /home/z/my-project/dev.log 2>&1
  EXIT_CODE=$?
  echo "=== Server exited with code $EXIT_CODE at $(date), restarting in 3s... ===" >> /home/z/my-project/server.log
  sleep 3
  rm -rf /home/z/my-project/.next
done
