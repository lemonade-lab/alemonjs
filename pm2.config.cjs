const args = [...process.argv].slice(2)
const index = args.indexOf('--run')
const main = argv[index + 1]
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
    script: main ?? 'node_modules/alemonjs/bin/index.js',
    // exec_mode: 'cluster',
    args: app.args,
    error_file: `./logs/${app.name}/err.log`,
    out_file: `./logs/${app.name}/out.log`,
    // 是否将所有进程的日志合并到一个文件中
    merge_logs: true,
    // 达到这个大小后日志文件进行轮转
    log_max_size: '10M',
    // 日志文件每天会被轮转一次
    log_rotate_interval: 'daily',
    // 日志格式
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    // 超时时间内进程仍未终止，则 PM2 将强制终止该进程
    kill_timeout: 5000,
    // 发送意外重启
    autorestart: true,
    // 进程到达指定内存时重启
    max_memory_restart: '2G',
    // 重启规则
    cron_restart: '0 */2 * * *',
    // 最大重启数
    max_restarts: 5,
    // 进程重启之间的延迟时间
    restart_delay: 5000,
    // 进程重启之间的最大延迟时间
    restart_delay_max: 10000,
    // 将 PM2 进程列表自动保存到文件中
    autodump: true,
    // 不监听文件变化
    watch: false,
    env: {
      NODE_ENV: 'production'
    }
  }))
}
