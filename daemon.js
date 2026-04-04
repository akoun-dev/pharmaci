const { fork } = require('child_process');
const path = require('path');

// Double fork to daemonize
const child = fork(path.join(__dirname, 'server-child.js'), [], {
  detached: true,
  stdio: 'ignore',
  cwd: '/home/z/my-project',
});

// Parent exits immediately, child gets adopted by PID 1
child.unref();
process.exit(0);
