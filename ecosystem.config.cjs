module.exports = {
  apps: [
    {
      name: 'pharmaci',
      cwd: '/home/akoun-dev/Documents/PROJETS/AUTRES/Apps/pharmaci',
      script: '.next/standalone/server.js',
      instances: 1,
      exec_mode: 'fork',
      env_file: '.env.production',
      env: {
        NODE_ENV: 'production',
        HOSTNAME: '0.0.0.0',
        PORT: 3000,
      },
    },
  ],
};
