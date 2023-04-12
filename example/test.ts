export const rule = {
  test: {
    reg: '^/松散测试$', //匹配消息正则，命令正则
    event: 'message',
    priority: 5000, //优先级，越小优先度越高
    describe: '[/松散测试]开发简单示例演示' //【命令】功能说明
  },
  example: {
    reg: '^/松散例子$', //匹配消息正则，命令正则
    event: 'message',
    priority: 5000, //优先级，越小优先度越高
    describe: '[/松散例子]开发简单示例演示' //【命令】功能说明
  }
}
export async function test(e: any) {
  /* 不允许私聊 */
  if (e.isGroup) return false
  e.reply('我收到了松散测试')
  return true
}
export async function example(e: any) {
  /* 不允许私聊 */
  if (e.isGroup) return false
  e.reply(`我收到了松散例子`)
  return true
}
