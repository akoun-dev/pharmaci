const { spawn } = require('child_process');
const fs = require('fs');
const logFile = '/home/z/my-project/dev.log';

function startServer() {
  const ts = new Date().toISOString();
  fs.appendFileSync(logFile, `\n[${ts}] Starting production server...\n`);

  const child = spawn('/usr/local/bin/bun', ['run', 'start'], {
    cwd: '/home/z/my-project',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (data) => {
    fs.appendFileSync(logFile, data.toString());
  });

  child.stderr.on('data', (data) => {
    fs.appendFileSync(logFile, data.toString());
  });

  child.on('exit', (code) => {
    const ts2 = new Date().toISOString();
    fs.appendFileSync(logFile, `\n[${ts2}] Server exited (code ${code}), restarting in 3s...\n`);
    setTimeout(startServer, 3000);
  });

  child.on('error', (err) => {
    const ts2 = new Date().toISOString();
    fs.appendFileSync(logFile, `\n[${ts2}] Error: ${err.message}, restarting in 3s...\n`);
    setTimeout(startServer, 3000);
  });
}

startServer();
