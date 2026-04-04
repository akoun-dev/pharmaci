// Pharma CI Server Watchdog
// Starts the Next.js production server and auto-restarts on crash
import { spawn } from 'child_process';
import { setInterval } from 'timers';

let serverProcess: ReturnType<typeof spawn> | null = null;

function startServer() {
  serverProcess = spawn('node', ['.next/standalone/server.js'], {
    cwd: '/home/z/my-project',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'production', PORT: '3000' },
  });

  serverProcess.stdout?.on('data', (data: Buffer) => {
    process.stdout.write(data.toString());
  });

  serverProcess.stderr?.on('data', (data: Buffer) => {
    process.stderr.write(data.toString());
  });

  serverProcess.on('exit', () => {
    console.log('[watchdog] Server exited, restarting in 1s...');
    serverProcess = null;
    setTimeout(startServer, 1000);
  });

  serverProcess.on('error', (err) => {
    console.error('[watchdog] Error:', err.message);
    serverProcess = null;
    setTimeout(startServer, 1000);
  });
}

// Also check every 5 seconds if the server is still responding
setInterval(() => {
  if (serverProcess && serverProcess.exitCode === null) {
    // Process still running, good
    return;
  }
  if (!serverProcess) {
    console.log('[watchdog] No server process, starting...');
    startServer();
  }
}, 5000);

startServer();
console.log('[watchdog] Pharma CI watchdog started');

// Keep process alive
setInterval(() => {}, 60000);
