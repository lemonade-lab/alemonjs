import { SessionEvents, AvailableIntentsEventsEnum } from 'qq-guild-bot'
import { GUILD } from './message/GUILDS.js'
import { CHANNEL } from './message/CHANNEL.js'
import { GUILD_MEMBERS } from './message/GUILD_MEMBERS.js'
import { DIRECT_MESSAGE } from './message/DIRECT_MESSAGE.js'
import { PUBLIC_GUILD_MESSAGES } from './message/PUBLIC_GUILD_MESSAGES.js'
import { GUILD_MESSAGE_REACTIONS } from './message/GUILD_MESSAGE_REACTIONS.js'
import { OPEN_FORUMS_EVENT } from './message/OPEN_FORUMS_EVENT.js'
import { GUILD_MESSAGES } from './message/GUILD_MESSAGES.js'
import { INTERACTION } from './message/INTERACTION.js'
import { MESSAGE_AUDIT } from './message/MESSAGE_AUDIT.js'
import { AUDIO_ACTION } from './message/AUDIO_ACTION.js'
import { FORUMS_EVENT } from './message/FORUMS_EVENT.js'
import { setBotMsgByQQ } from './bot.js'
import { BOTCONFIG } from '../../config/index.js'

interface BotData {
  version: number
  session_id: string
  user: {
    id: string
    username: string
    bot: boolean
    status: number
  }
  shard: {
    0: number
    1: number
  }
}

/**
 * 会话事件分类
 * @param ws
 */
export const createConversationByQQ = ws => {
  /**
   * 准备
   */
  ws.on(SessionEvents.READY, async data => {
    const cfg = BOTCONFIG.get('qq')
    if (cfg.sandbox) {
      console.info('ready', data)
    }
    const robot: BotData = data.msg
    const bot = {
      id: robot.user.id,
      name: robot.user.username,
      avatar: ''
    }
    // 设置bot信息
    setBotMsgByQQ(bot)
    /**
     * 基础权限
     */

    /**
     * 机器人进出频道消息
     */
    ws.on(AvailableIntentsEventsEnum.GUILDS, event => {
      if (new RegExp(/^GUILD.*$/).test(event.eventType)) {
        GUILD(event)
      } else {
        CHANNEL(event)
      }
    })

    /**
     * 成员频道进出变动消息
     */
    ws.on(AvailableIntentsEventsEnum.GUILD_MEMBERS, GUILD_MEMBERS)

    /**
     * 私聊会话消息
     */
    ws.on(AvailableIntentsEventsEnum.DIRECT_MESSAGE, DIRECT_MESSAGE)

    /**
     * 频道会话消息（公域）
     */
    ws.on(
      AvailableIntentsEventsEnum.PUBLIC_GUILD_MESSAGES,
      PUBLIC_GUILD_MESSAGES
    )

    /**
     * ***
     * 需申请权限
     * **
     */

    /**
     * 频道会话消息（私域）
     */
    ws.on(AvailableIntentsEventsEnum.GUILD_MESSAGES, GUILD_MESSAGES)

    /**
     * 论坛消息（私域）
     */
    ws.on(AvailableIntentsEventsEnum.FORUMS_EVENT, FORUMS_EVENT)

    /**
     * 论坛消息（公域）
     */
    ws.on('OPEN_FORUMS_EVENT', OPEN_FORUMS_EVENT)

    /**
     * 频道表情点击会话消息
     */
    ws.on(
      AvailableIntentsEventsEnum.GUILD_MESSAGE_REACTIONS,
      GUILD_MESSAGE_REACTIONS
    )

    /**
     * 互动事件监听
     */
    ws.on(AvailableIntentsEventsEnum.INTERACTION, INTERACTION)
    ws.on(AvailableIntentsEventsEnum.MESSAGE_AUDIT, MESSAGE_AUDIT)

    /**
     * 审核事件监听
     */
    ws.on(AvailableIntentsEventsEnum.AUDIO_ACTION, AUDIO_ACTION)
    console.info('qq', 'Welcome back', bot.name)
  })

  /**
   * 权限错误
   */
  ws.on(SessionEvents.ERROR, (one: any) => {
    console.error('err', one)
  })

  /**
   * 超长断连
   */
  ws.on(SessionEvents.DEAD, (one: any) => {
    console.error('dead', one)
  })

  /**
   * 关闭
   */
  ws.on(SessionEvents.CLOSED, (one: any) => {
    console.error('close', one)
  })

  /**
   * 断开连接
   */
  ws.on(SessionEvents.DISCONNECT, (one: any) => {
    console.error('disconnect', one)
  })

  /**
   * 无效会话
   */
  ws.on(SessionEvents.INVALID_SESSION, (one: any) => {
    console.error('invalid session', one)
  })

  /**
   * 再连接
   */
  ws.on(SessionEvents.RECONNECT, (one: any) => {
    console.error('reconnect', one)
  })

  /**
   * 重新开始
   */
  ws.on(SessionEvents.RESUMED, (one: any) => {
    console.error('resumed', one)
  })

  /**
   * WS断连
   */
  ws.on(SessionEvents.EVENT_WS, async one => {
    if (one.eventType == 'DISCONNECT') {
      console.info('ws disconnect', one)
    }
  })
}
