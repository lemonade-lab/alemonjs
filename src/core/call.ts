import { AMessage, EventEnum } from './typings.js'
import { orderBy } from 'lodash-es'
class Call {
  /**
   * 初始化数据
   */
  data = {
    AUDIO_FREQUENCY: [],
    AUDIO_MICROPHONE: [],
    CHANNEL: [],
    FORUMS_POST: [],
    FORUMS_REPLY: [],
    FORUMS_THREAD: [],
    GUILD: [],
    GUILD_BOT: [],
    GUILD_MEMBERS: [],
    GUILD_MESSAGE_REACTIONS: [],
    INTERACTION: [],
    MESSAGES: [],
    message: []
  } as {
    [Event in (typeof EventEnum)[number]]: {
      priority: number
      call: (e: AMessage) => any
    }[]
  }

  /**
   * 回调排序
   */
  order() {
    for (const val in this.data) {
      this.data[val] = orderBy(this.data[val], ['priority'], ['asc'])
    }
  }

  /**
   * 设置回调
   * @param event
   * @param call
   * @param priority
   */
  set(
    event: (typeof EventEnum)[number],
    call: (e: AMessage) => any,
    priority = 9000
  ) {
    this.data[event].push({
      call,
      priority
    })
  }

  /**
   * 得到回调
   * @param key
   * @returns
   */
  get(key: string) {
    return this.data[key]
  }
}

export const CALL = new Call()
