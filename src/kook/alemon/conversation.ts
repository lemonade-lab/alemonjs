import { PUBLIC_GUILD_MESSAGES_KOOK } from './message/PUBLIC_GUILD_MESSAGES.js'
import { DIRECT_MESSAGE } from './message/DIRECT_MESSAGE.js'
import { EventData, SystemData } from '../sdk/index.js'
import { GUILD_MESSAGE_REACTIONS } from './message/GUILD_MESSAGE_REACTIONS.js'
/**
 * 事件处理集
 */
const ConversationMap = {
  /**
   * 文字消息
   */
  [1]: {
    public: PUBLIC_GUILD_MESSAGES_KOOK,
    direct: DIRECT_MESSAGE
  },
  /**
   * 图片消息，
   */
  [2]: {
    public: PUBLIC_GUILD_MESSAGES_KOOK,
    direct: DIRECT_MESSAGE
  },
  /**
   * 视频消息，
   */
  [3]: {
    public: PUBLIC_GUILD_MESSAGES_KOOK,
    direct: DIRECT_MESSAGE
  },
  /**
   * 文件消息，
   */
  [4]: {
    public: PUBLIC_GUILD_MESSAGES_KOOK,
    direct: DIRECT_MESSAGE
  },
  /**
   * 音频消息，
   */
  [8]: {
    public: PUBLIC_GUILD_MESSAGES_KOOK,
    direct: DIRECT_MESSAGE
  },
  /**
   * mk消息
   */
  [9]: {
    public: PUBLIC_GUILD_MESSAGES_KOOK,
    direct: DIRECT_MESSAGE
  },
  /**
   * card消息，
   */
  [10]: {
    public: PUBLIC_GUILD_MESSAGES_KOOK,
    direct: DIRECT_MESSAGE
  },
  /**
   * 系统消息
   * @param event
   */
  [255]: {
    public: async (event: SystemData) => {
      if (
        event.extra.type == 'added_reaction' ||
        event.extra.type == 'deleted_reaction'
      ) {
        //StatementData
        return await GUILD_MESSAGE_REACTIONS(event)
      } else if (event.extra.type == 'joined_channel') {
        //
        console.info('joined_channel')
        return
      } else if (event.extra.type == 'exited_channel') {
        //
        console.info('exited_channel')
        return
      } else if (event.extra.type == 'updated_channel') {
        // ChannelData
        console.info('updated_channel')
        return
        /**
         * ***********
         * 频道进出
         * *******
         */
      } else if (event.extra.type == 'joined_guild') {
        console.info('joined_guild')
        return
      } else if (event.extra.type == 'exited_guild') {
        console.info('exited_guild')
        return
        /**
         * **********
         * 消息变动
         * ********
         */
      } else if (event.extra.type == 'updated_message') {
        // 消息更新
        // EditingData
        console.info('updated_message')
        return
      } else if (event.extra.type == 'pinned_message') {
        // 顶置消息
        // overheadData
        console.info('pinned_message')
        return
      }
    },
    direct: async (event: SystemData) => {
      if (event.extra.type == 'guild_member_online') {
        //OnLineData
        console.info('exited_guild')
        return
      }
    }
  }
}

/**
 * 消息接收入口
 * @param req
 * @param res
 */
export async function conversation(event: EventData | SystemData) {
  if (process.env?.ALEMONJS_EVENT == 'dev') console.info('event', event)
  if (Object.prototype.hasOwnProperty.call(ConversationMap, event.type)) return
  if (event.channel_type == 'GROUP') {
    ConversationMap[event.type]['public'](event)
  } else {
    ConversationMap[event.type]['direct'](event)
  }
  return
}
