module.exports = {
  apps: [
    {
      name: 'alemont-bot',
      interpreter: 'node_modules/.bin/ts-node',
      script: 'index.ts',
      exec_mode: 'cluster',
      instances: 1,
      max_memory_restart: '1G',
      autorestart: true,
      autodump: true,
      merge_logs: true,
      error_file: './logs/alemont-bot/err.log',
      out_file: './logs/alemont-bot/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z'
    }
  ]
}
