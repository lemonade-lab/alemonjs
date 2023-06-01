import { IOpenAPI, IGuild } from 'qq-guild-bot'
import { EventEmitter } from 'ws'
import { SessionEvents } from 'qq-guild-bot'
import { BotType, BotConfigType, cmdInit } from 'alemon'
/* 监听消息 */
import { GUILDS } from './message/GUILDS'
import { GUILD_MEMBERS } from './message/GUILD_MEMBERS'
import { DIRECT_MESSAGE } from './message/DIRECT_MESSAGE'
import { PUBLIC_GUILD_MESSAGES } from './message/PUBLIC_GUILD_MESSAGES'
import { GUILD_MESSAGE_REACTIONS } from './message/GUILD_MESSAGE_REACTIONS'
import { OPEN_FORUMS_EVENT } from './message/OPEN_FORUMS_EVENT'
import { GUILD_MESSAGES } from './message/GUILD_MESSAGES'
import { INTERACTION } from './message/INTERACTION'
import { MESSAGE_AUDIT } from './message/MESSAGE_AUDIT'
import { AUDIO_ACTION } from './message/AUDIO_ACTION'
import { FORUMS_EVENT } from './message/FORUMS_EVENT'

declare global {
  //接口对象
  var client: IOpenAPI
  //连接对象
  var ws: EventEmitter
  //机器人信息
  var robot: BotType
  //频道管理
  var guilds: Array<IGuild>
  //机器人配置
  var cfg: BotConfigType
}
/**
 * ws.on方法可以监听机器人所在频道的所有事件
 * 根据其e.eventType，判断出事件的具体类型
 */
export const createConversation = () => {
  /** 准备 */
  ws.on(SessionEvents.READY, async one => {
    if (cfg.sandbox) console.info('[READY]', one)
    /* 记录机器人信息 */
    global.robot = one.msg
    /* 初始化指令 */
    cmdInit()
    global.guilds = await client.meApi
      .meGuilds()
      .then(res => {
        const { data } = res
        return data
      })
      .catch(err => {
        console.error(err)
        return []
      })
    /* 基础权限 */
    GUILDS() //机器人进出频道消息
    GUILD_MEMBERS() //成员频道进出变动消息
    DIRECT_MESSAGE() //私聊会话消息
    /* 基础权限 */
    PUBLIC_GUILD_MESSAGES() //频道会话消息（公域）
    /* 需申请权限 */
    GUILD_MESSAGES() //频道会话消息（私域）
    /* 需申请权限 */
    FORUMS_EVENT() //论坛消息（私域）
    OPEN_FORUMS_EVENT() //论坛消息（公域）
    GUILD_MESSAGE_REACTIONS() //频道表情点击会话消息
    INTERACTION() //互动事件监听
    MESSAGE_AUDIT() //审核事件监听
    AUDIO_ACTION() //音频事件
    console.info('[READY]', ` 欢迎回来 ${robot.user.username} ~`)
  })

  /** 权限错误 */
  ws.on(SessionEvents.ERROR, (one: any) => {
    console.error('[ERROR]', one)
  })

  /**  超长断连 */
  ws.on(SessionEvents.DEAD, (one: any) => {
    console.error('DEAD', one)
    console.error('请确认配置！')
    console.error('账户密码是否正确？')
    console.error('域事件是否匹配？')
  })

  /* 关闭 */
  ws.on(SessionEvents.CLOSED, (one: any) => {
    console.error('[CLOSED]', one)
  })

  /** 断开连接 */
  ws.on(SessionEvents.DISCONNECT, (one: any) => {
    console.error('[DISCONNECT]', one)
  })

  /* 无效会话 */
  ws.on(SessionEvents.INVALID_SESSION, (one: any) => {
    console.error('[INVALID_SESSION]', one)
  })

  /* 再连接 */
  ws.on(SessionEvents.RECONNECT, (one: any) => {
    console.error('[RECONNECT]', one)
  })

  /* 重新开始 */
  ws.on(SessionEvents.RESUMED, (one: any) => {
    console.error('[RESUMED]', one)
  })

  /* WS断连 */
  ws.on(SessionEvents.EVENT_WS, async one => {
    if (one.eventType == 'DISCONNECT') {
      console.log('[EVENT_WS][DISCONNECT]', one)
    }
  })
}
