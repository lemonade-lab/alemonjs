const argv = [...process.argv].slice(4)
const BotName = 'alemonb'
const findArgs = argv.find(item => item.startsWith('@'))
const apps = []
if (!findArgs) {
  apps.push({
    name: BotName,
    args: argv
  })
} else {
  if (!argv[0].startsWith('@')) argv.unshift(BotName)
  const msg = argv.join(' ')
  const arr = msg.split('@')
  for (const arg of arr) {
    if (arg == '') continue
    const ar = arg.split(' ')
    const existingApp = apps.find(app => app.name === ar[0])
    if (!existingApp) {
      const name = ar.shift()
      if (name != undefined) {
        apps.push({
          name: name,
          args: ar ?? []
        })
      }
    }
  }
}
console.log('------------------------------------------')
module.exports = {
  apps: apps.map(app => ({
    name: app.name,
    script: 'node_modules/alemonjs/bin/index.js',
    instances: 1,
    autorestart: true,
    exec_mode: 'cluster',
    max_memory_restart: '2G',
    cron_restart: '0 */2 * * *',
    args: app.args,
    watch: false,
    autodump: true,
    merge_logs: true,
    error_file: `./logs/${app.name}/err.log`,
    out_file: `./logs/${app.name}/out.log`,
    log_max_size: '10M',
    log_rotate_interval: 'daily',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    env: {
      NODE_ENV: 'production'
    },
    kill_timeout: 5000,
    listen_timeout: 3000,
    max_restarts: 10,
    restart_delay: 5000,
    restart_delay_max: 10000
  }))
}
