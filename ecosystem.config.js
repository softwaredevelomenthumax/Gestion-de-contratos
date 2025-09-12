module.exports = {
  apps: [
    {
      name: 'contract-api',
      script: 'server.js',
      cwd: '\\\\SVR2\\Users\\miguel.isaza\\App',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/contract-api-error.log',
      out_file: './logs/contract-api-out.log',
      log_file: './logs/contract-api-combined.log',
      time: true
    },
    {
      name: 'contract-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: '\\\\SVR2\\Users\\miguel.isaza\\App\\Frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/contract-frontend-error.log',
      out_file: './logs/contract-frontend-out.log',
      log_file: './logs/contract-frontend-combined.log',
      time: true
    }
  ]
};
