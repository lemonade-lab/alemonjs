module.exports = {
  name: 'redis-server',
  //redis路径:使用于linux
  //如果是windows对应的应用C:\\Program Files\\Redis\\redis-server.exe
  //但windows更推荐使用win服务以自动开启服务
  script: 'redis-server',
  args: ['--port', '6379', '--bind', '127.0.0.1', '--ignore-warnings', 'ARM64-COW-BUG'],
  autorestart: true
}
