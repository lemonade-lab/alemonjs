import { messgetype } from '../src/lib/types'
const HellpConfig = {
  name: 'hello',  //中文名
  dsc: '[/你好呀]开发简单示例演示', //【命令】功能说明
  priority: 5000, //优先级，越小优先度越高
  reg: '^/你好呀$', //匹配消息正则，命令正则
  fnc: 'onHello' //函数
}

/**
 * 指令集
 */
export const rule = [
  {
    event: 'GUILD_MESSAGES', //响应频道事件
    eventType: 'MESSAGE_CREATE', //
    ...HellpConfig
  },
  {
    event: 'DIRECT_MESSAGE', // 响应私聊事件
    eventType: 'DIRECT_MESSAGE_CREATE', //
    ...HellpConfig
  }
]

/**
 * 指令方法
 * @param e 消息对象
 * @returns
 */
export async function onHello(e: messgetype) {
  e.reply('你好呀~', {
    image: 'http://tva1.sinaimg.cn/bmiddle/6af89bc8gw1f8ub7pm00oj202k022t8i.jpg'
  })
  return true
}
