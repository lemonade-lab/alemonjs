import { red } from 'kolorist'
import { messgetype, pluginType } from './types'
export default class plugin {
  /* 字段类型 */
  [parameter: string]: pluginType

  /**
   * @param name 类名标记  用于特殊需要时的唯一标记
   * @param dsc 类名描述   用于描述该类的主要作用
   * @param event 事件类型
   *
   * 机器人进出 GUILDS
   * 成员进出 GUILD_MEMBERS
   *
   * - 表情点击 GUILD_MESSAGE_REACTIONS
   * - 频道 PUBLIC_GUILD_MESSAGES (公)  GUILD_MESSAGES (私)
   * - 私信 DIRECT_MESSAGE
   *
   * 互动事件 INTERACTION
   * 消息审核事件 MESSAGE_AUDIT
   *
   * 论坛事件  OPEN_FORUMS_EVENT （公）  FORUMS_EVENT （私）
   *
   * 音频会话 AUDIO_ACTION
   * @param eventType 消息类型   该事件暂未开始设计（默认排除撤回消息）
   * @param priority 优先级      数字越小优先级越高
   * @param rule.reg 命令正则      RegExp(rule.reg)
   * @param rule.fnc 命令执行方法    function
   */
  constructor({
    name = 'your-name',
    dsc = 'undifind',
    //默认为私域
    event = 'GUILD_MESSAGES',  
    // 私域且非测回消息
    eventType = 'MESSAGE_CREATE',
    priority = 5000,
    rule = <any>[]
  }) {
    this.name = name
    this.dsc = dsc
    this.event = event
    this.eventType = eventType
    this.priority = priority
    this.rule = rule
  }

  /**
   * 专用于在频道中转为私聊回复
   * 需要设置机器人允许私聊
   */
  async reply(e: messgetype, content: string): Promise<boolean> {
    if (e.isGroup) return false
    const postSessionRes: any = await client.directMessageApi
      .createDirectMessage({
        source_guild_id: e.msg.guild_id,
        recipient_id: e.msg.author.id
      })
      .catch((err:any)=>console.log(red(err)))
    if (!postSessionRes) return false
    const {
      data: { guild_id }
    } = postSessionRes
    client.directMessageApi
      .postDirectMessage(guild_id, {
        msg_id: e.msg.id,
        content
      })
      .catch((err:any)=>console.log(red(err)))
    return true
  }
}
