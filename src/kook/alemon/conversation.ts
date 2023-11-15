import { PUBLIC_GUILD_MESSAGES_KOOK } from './message/PUBLIC_GUILD_MESSAGES.js'
import { DIRECT_MESSAGE } from './message/DIRECT_MESSAGE.js'
import { EventData, SystemData } from '../sdk/index.js'
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
  [255]: (event: SystemData) => {
    console.info('system message', new Date(event.msg_timestamp))
  }
}

/**
 * 消息接收入口
 * @param req
 * @param res
 */
export async function callBackByKOOK(event: EventData | SystemData) {
  if (Object.prototype.hasOwnProperty.call(ConversationMap, event.type)) {
    if (event.channel_type == 'GROUP') {
      // 公的
      return await ConversationMap[event.type]['public'](event)
    } else {
      // 私的
      return await ConversationMap[event.type]['direct'](event)
    }
  }
  return false
}
