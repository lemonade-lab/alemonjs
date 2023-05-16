const ci = console.info
console.info = (...args: any[]) => {
  // 移除 心跳校验 和最大重试提示
  if (
    args[0] !== '[CLIENT] 心跳校验' &&
    args[0] !== '[CLIENT] 超过重试次数，连接终止' &&
    args[0] !== '[ERROR] createSession: '
  ) {
    ci(...args)
  }
}
