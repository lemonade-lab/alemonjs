import { messgetype } from '../src/lib/types'
/**
 * 指令集导出
 */
export const rule = [
  {
    name: 'hello', //中文名
    dsc: '[/你好呀]开发简单示例演示', //【命令】功能说明
    event: 'GUILD_MESSAGES', //频道
    eventType: 'MESSAGE_CREATE', //
    priority: 5000, //优先级，越小优先度越高
    reg: '^/你好呀$', //匹配消息正则，命令正则
    fnc: 'test' //函数
  },
  {
    name: 'hello', //中文名
    dsc: '[/你好呀]开发简单示例演示', //【命令】功能说明
    event: 'DIRECT_MESSAGE', // 私聊
    eventType: 'DIRECT_MESSAGE_CREATE', //
    priority: 5000, //优先级，越小优先度越高
    reg: '^/你好呀$', //匹配消息正则，命令正则
    fnc: 'test' //函数
  }
]

/**
 * 指令方法
 * @param e 消息对象
 * @returns
 */
export async function test(e: messgetype) {
  e.reply('你好呀~', {
    image: 'http://tva1.sinaimg.cn/bmiddle/6af89bc8gw1f8ub7pm00oj202k022t8i.jpg'
  })
  return true
}
