import { Request, Response } from 'express'
import { BotEvent, MessageContentType } from './types.js'
import { MESSAGES } from './message/MESSAGES.js'
import { GUILD_MEMBERS } from './message/GUILD_MEMBERS.js'
import { GUILD_MESSAGE_REACTIONS } from './message/GUILD_MESSAGE_REACTIONS.js'

/** 事件合集 */
const ConversationMap = {
  [1]: GUILD_MEMBERS,
  [2]: MESSAGES,
  [3]: async (event: BotEvent) => {
    console.log('机器人进入别野', event.robot.villa_id)
    console.log('机器人进入别野', event.robot.template)
    console.log('机器人进入别野', event.type)
    console.log('机器人进入别野', event.created_at)
    console.log('机器人进入别野', event.id)
    console.log('机器人进入别野', event.send_at)
    console.log('机器人退出别野', event.extend_data.EventData)
    return true
  },
  [4]: async (event: BotEvent) => {
    console.log('机器人退出别野', event.robot.villa_id)
    console.log('机器人退出别野', event.robot.template)
    console.log('机器人退出别野', event.type)
    console.log('机器人退出别野', event.created_at)
    console.log('机器人退出别野', event.id)
    console.log('机器人退出别野', event.send_at)
    console.log('机器人退出别野', event.extend_data.EventData)
    return true
  },
  [5]: GUILD_MESSAGE_REACTIONS,
  [6]: async (event: BotEvent) => {
    console.log('审核事件', event.robot.villa_id)
    console.log('审核事件', event.robot.template)
    console.log('审核事件', event.type)
    console.log('审核事件', event.created_at)
    console.log('审核事件', event.id)
    console.log('审核事件', event.send_at)
    /**  数据包 */
    const MessageContent: MessageContentType = JSON.parse(
      event.extend_data.EventData.SendMessage.content
    )
    console.log('审核事件', MessageContent)
    return true
  }
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
    await ConversationMap[event.type](event)
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
