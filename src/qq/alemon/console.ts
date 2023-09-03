const info = console.info
/**
 * 屏蔽错误反馈
 * @param args
 */
console.info = (...args: any[]) => {
  if (
    args[0] !== '[CLIENT] 心跳校验' &&
    args[0] !== '[CLIENT] 超过重试次数，连接终止' &&
    args[0] !== '[ERROR] createSession: '
  ) {
    info(...args)
  }
}
