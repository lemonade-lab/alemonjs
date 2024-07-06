const argv = [...process.argv].slice(4)

/**
 *
 * @param {*} name
 * @param {*} script
 * @returns
 */
function getRunScriptApp(script = 'index.ts', options = {}) {
  const { name } = options
  const initName = name ?? 'alemonb'
  return {
    name: initName,
    script: 'node',
    args: [
      '--no-warnings=ExperimentalWarning',
      '--loader',
      'ts-node/esm',
      script
    ].concat(argv),
    interpreter: 'none',
    ext: 'ts',
    error_file: `./logs/${initName}/err.log`,
    out_file: `./logs/${initName}/out.log`,
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
    },
    ...options
  }
}

module.exports = getRunScriptApp
