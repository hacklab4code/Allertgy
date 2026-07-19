const path = require('path');
const ROOT = __dirname;

module.exports = {
  apps: [
    {
      name: 'allertgy-api',
      script: path.join(ROOT, 'scripts/run-backend.sh'),
      interpreter: '/bin/bash',
      autorestart: true,
      max_restarts: 100,
      min_uptime: '10s',
      restart_delay: 3000,
    },
    {
      name: 'allertgy-expo',
      script: path.join(ROOT, 'scripts/run-expo.sh'),
      interpreter: '/bin/bash',
      autorestart: true,
      max_restarts: 100,
      min_uptime: '15s',
      restart_delay: 5000,
    },
    {
      name: 'allertgy-web',
      script: path.join(ROOT, 'scripts/run-web.sh'),
      interpreter: '/bin/bash',
      autorestart: true,
      max_restarts: 50,
      min_uptime: '10s',
      restart_delay: 3000,
    },
  ],
};
