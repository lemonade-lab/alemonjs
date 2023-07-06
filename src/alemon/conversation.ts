import { Request, Response } from 'express'
import { BotEvent } from './types.js'
import { MESSAGES } from './message/MESSAGES.js'
import { GUILD_MEMBERS } from './message/GUILD_MEMBERS.js'
import { GUILD_MESSAGE_REACTIONS } from './message/GUILD_MESSAGE_REACTIONS.js'
import { MESSAGE_AUDIT } from './message/MESSAGE_AUDIT.js'
import { GUILDS } from './message/GUILDS.js'

/** 事件合集 */
const ConversationMap = {
  [1]: GUILD_MEMBERS,
  [2]: MESSAGES,
  [3]: GUILDS,
  [4]: GUILDS,
  [5]: GUILD_MESSAGE_REACTIONS,
  [6]: MESSAGE_AUDIT
}

/**
 * 消息接收入口
 * @param req
 * @param res
 */
export async function callback(req: Request, res: Response) {
  try {
    // 从请求体中获取事件对象
    const event: BotEvent = req.body.event
    /** 错误调用  */
    if (!event || !event.robot) {
      console.log('错误调用~')
      // 处理完毕后返回响应
      res.status(200).json({ message: '', retcode: 0 })
      return
    }
    /** 根据不同的消息类型分不同的执行模块 */
    await ConversationMap[event.type](event, event.type)
  } catch (err) {
    console.log(err)
    // 处理完毕后返回响应
    res.status(200).json({ message: '', retcode: 0 })
    return
  }
  // 处理完毕后返回响应
  res.status(200).json({ message: '', retcode: 0 })
  return
}
