import { Messgetype, EType, RuleType, SuperType } from './types'
export default class plugin {
  name?: string
  dsc?: string
  event?: EType
  eventType?: string
  priority?: number
  rule?: Array<RuleType>
  /**
   * @param name 类名标记  用于特殊需要时的唯一标记
   * @param dsc 类名描述   用于描述该类的主要作用
   * @param event 事件类型
   * @param eventType 消息类型
   * @param priority 优先级      数字越小优先级越高
   * @param rule.reg 命令正则      RegExp(rule.reg)
   * @param rule.fnc 命令执行方法    function
   */
  constructor({
    name = 'your-name',
    dsc = 'dsc',
    event = EType.MESSAGES,
    eventType = 'CREATE',
    priority = 5000,
    rule = []
  }: SuperType) {
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
  async reply(e: Messgetype, content: string): Promise<boolean> {
    if (e.isGroup) return false

    const postSessionRes: any = await client.directMessageApi
      .createDirectMessage({
        source_guild_id: e.msg.guild_id,
        recipient_id: e.msg.author.id
      })
      .catch((err: any) => {
        e.reply('失败啦~')
        console.error(err)
      })

    if (!postSessionRes) {
      e.reply('该机器人没有权限哦~')
      return false
    }

    const {
      data: { guild_id }
    } = postSessionRes

    if (!guild_id) {
      e.reply('出错啦~')
      return false
    }

    return await client.directMessageApi
      .postDirectMessage(guild_id, {
        msg_id: e.msg.id,
        content
      })
      .then(() => true)
      .catch(err => {
        e.reply('出错啦~')
        console.error(err)
        return false
      })
  }
}
