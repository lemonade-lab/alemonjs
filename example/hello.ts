import { messgetype } from '../src/lib/types'

/**该文件将示范如何同一条指令同时推送频道域私聊都同时起作用 */

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
  /**
   * 这里推送了两个响应事件，同时指向了  reg这一条指令
   */
  {
    event: 'GUILD_MESSAGES', //响应频道事件
    eventType: 'MESSAGE_CREATE', //非撤回类型
    ...HellpConfig   //扩展配置属性
  },
  {
    event: 'DIRECT_MESSAGE', // 响应私聊事件
    eventType: 'DIRECT_MESSAGE_CREATE', //非撤回类型
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
