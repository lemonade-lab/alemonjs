import { AMessage, EventEnum } from './typings.js'
import { orderBy } from 'lodash-es'
class Call {
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

  order() {
    for (const val in this.data) {
      this.data[val] = orderBy(this.data[val], ['priority'], ['asc'])
    }
  }

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

  get(key: string) {
    return this.data[key]
  }
}

export const CALL = new Call()
