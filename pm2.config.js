module.exports = {
  apps: [
    {
      name: 'alemon',
      script: 'index.ts',
      interpreter: 'node_modules/.bin/ts-node',
      instances: 1,
      autorestart: true,
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      watch: false,
      autodump: true,
      merge_logs: true,
      error_file: 'logs/alemon/err.log',
      out_file: 'logs/alemon/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm',
      env: {
        NODE_ENV: 'production'
      },
      kill_timeout: 5000,
      listen_timeout: 3000,
      max_restarts: 10,
      restart_delay: 5000,
      restart_delay_max: 10000
    }
  ]
}
