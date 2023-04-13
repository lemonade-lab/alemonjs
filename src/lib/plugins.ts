import { messgetype, pluginType } from './types'
export default class plugin {
  /* 字段类型 */
  [parameter: string]: pluginType

   /**
   * @param dsc 插件描述   用于描述对象类型
   * @param event 事件类型    
   * 
   * 机器人进出 GUILDS
   * 成员进出 GUILD_MEMBERS 
   * 
   * 下方可能会归类为 message 事件
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
   * 
   * @param priority 优先级      数字越小优先级越高
   * @param rule.reg 命令正则      RegExp(rule.reg)
   * @param rule.fnc 命令执行方法    function
   */
   constructor({ dsc = 'undifind', event = 'GUILD_MESSAGES', eventType='' ,priority = 500, rule = <any>[] }) {
    /** 描述 */
    this.dsc = dsc

    /** 未定义则默认为message会话 */
    this.event = event

    this.eventType=eventType

    /** 优先级,数字越小越高 */
    this.priority = priority

    /** 正则指令数组,默认为[] */
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
      .catch((err) => {
        console.log(err)
      })
    if (!postSessionRes) return false
    const {
      data: { guild_id }
    } = postSessionRes
    client.directMessageApi
      .postDirectMessage(guild_id, {
        msg_id: e.msg.id,
        content
      })
      .catch((err) => {
        // err信息错误码请参考API文档错误码描述
        console.log(err)
      })
    return true
  }
}
