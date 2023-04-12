import { messgetype, pluginType } from './types'
export default class plugin {
  /* 字段类型 */
  [parameter: string]: pluginType

  /**
   * @param dsc 插件描述   用于描述对象类型
   * @param event 事件类型    频道&私信message  成员进出nember 机器人进出robot  表情点击 messageions  音频会话 audio
   * @param priority 优先级      数字越小优先级越高
   * @param rule.reg 命令正则      RegExp(rule.reg)
   * @param rule.fnc 命令执行方法    function
   */
  constructor({ describe = 'undifind', event = 'message', priority = 500, rule = <any>[] }) {
    /** 描述 */
    this.describe = describe

    /** 未定义则默认为message会话 */
    this.event = event

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
