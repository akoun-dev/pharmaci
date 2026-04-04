const { spawn } = require('child_process');
const fs = require('fs');
const logFile = '/home/z/my-project/dev.log';

function startServer() {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `\n[${timestamp}] Starting dev server...\n`);

  const child = spawn('npx', ['next', 'dev', '-p', '3000'], {
    cwd: '/home/z/my-project',
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });

  child.stdout.on('data', (data) => {
    process.stdout.write(data);
    fs.appendFileSync(logFile, data.toString());
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(data);
    fs.appendFileSync(logFile, data.toString());
  });

  child.on('exit', (code) => {
    const ts = new Date().toISOString();
    fs.appendFileSync(logFile, `\n[${ts}] Server exited with code ${code}, restarting in 2s...\n`);
    setTimeout(startServer, 2000);
  });

  child.on('error', (err) => {
    const ts = new Date().toISOString();
    fs.appendFileSync(logFile, `\n[${ts}] Server error: ${err.message}, restarting in 2s...\n`);
    setTimeout(startServer, 2000);
  });
}

startServer();
