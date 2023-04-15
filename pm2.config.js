module.exports = {
  apps: [
    {
      name: 'alemont-bot',
      script: 'index.ts',
      interpreter: 'node_modules/.bin/ts-node',
      instances: 1,
      autorestart: true,
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      watch: false,
      autodump: true,
      merge_logs: true,
      error_file: './logs/alemont-bot/err.log',
      out_file: './logs/alemont-bot/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
