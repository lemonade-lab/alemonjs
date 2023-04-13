import { messgetype } from '../src/lib/types'
/**
 * 指令集导出
 */
export const rule = {
  test: {
    name: 'rule-name',  //中文名
    reg: '^/回复我$', //匹配消息正则，命令正则
    event: 'GUILD_MESSAGES',
    priority: 5000, //优先级，越小优先度越高
    dsc: '[/回复我]开发简单示例演示', //【命令】功能说明
    eventType: ''  //暂未定义
  }
}

/**
 * 指令方法
 * @param e 消息对象
 * @returns 
 */

export async function test(e: messgetype) {
  /* 不允许私聊 */
  if (e.isGroup) return false
  e.reply('回复你啦~')
  return true
}