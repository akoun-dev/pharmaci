#!/bin/bash
# Double-fork to daemonize: child gets adopted by PID 1 (tini)
cd /home/z/my-project

if fork; then
  # Parent exits immediately
  exit 0
fi

# Child - now orphaned, will be adopted by PID 1
exec > /home/z/my-project/dev.log 2>&1
exec /usr/local/bin/bun run start
