import { KOOKEventKey } from './message.js';
import { SystemData } from './typings.js';

/**
 * 事件处理集
 */
export const ConversationMap = {
  /**
   * 文字消息
   */
  [1]: {
    public: () => KOOKEventKey['MESSAGES_PUBLIC'],
    direct: () => KOOKEventKey['MESSAGES_DIRECT']
  },
  /**
   * 图片消息，
   */
  [2]: {
    public: () => KOOKEventKey['MESSAGES_PUBLIC'],
    direct: () => KOOKEventKey['MESSAGES_DIRECT']
  },
  /**
   * 视频消息，
   */
  [3]: {
    public: () => KOOKEventKey['MESSAGES_PUBLIC'],
    direct: () => KOOKEventKey['MESSAGES_DIRECT']
  },
  /**
   * 文件消息，
   */
  [4]: {
    public: () => KOOKEventKey['MESSAGES_PUBLIC'],
    direct: () => KOOKEventKey['MESSAGES_DIRECT']
  },
  /**
   * 音频消息，
   */
  [8]: {
    public: () => KOOKEventKey['MESSAGES_PUBLIC'],
    direct: () => KOOKEventKey['MESSAGES_DIRECT']
  },
  /**
   * mk消息
   */
  [9]: {
    public: () => KOOKEventKey['MESSAGES_PUBLIC'],
    direct: () => KOOKEventKey['MESSAGES_DIRECT']
  },
  /**
   * card消息，
   */
  [10]: {
    public: () => KOOKEventKey['MESSAGES_PUBLIC'],
    direct: () => KOOKEventKey['MESSAGES_DIRECT']
  },
  /**
   * 系统消息
   * @param event
   */
  [255]: {
    public: (event: SystemData) => {
      if (event.extra.type === 'added_reaction' || event.extra.type === 'deleted_reaction') {
        return KOOKEventKey['REACTIONS'];
      } else if (event.extra.type === 'joined_channel') {
        console.info('joined_channel');

        return '';
      } else if (event.extra.type === 'exited_channel') {
        console.info('exited_channel');

        return '';
      } else if (event.extra.type === 'updated_channel') {
        // ChannelData
        console.info('updated_channel');

        return KOOKEventKey['CHANNEL_UPDATE'];
        /**
         * ***********
         * 频道进出
         * *******
         */
      } else if (event.extra.type === 'joined_guild') {
        console.info('joined_guild');

        return KOOKEventKey['MEMBER_ADD'];
      } else if (event.extra.type === 'exited_guild') {
        console.info('exited_guild');

        return KOOKEventKey['MEMBER_REMOVE'];
      } else if (event.extra.type === 'self_joined_guild') {
        console.info('self_joined_guild');

        return KOOKEventKey['GUILD_JOIN'];
      } else if (event.extra.type === 'self_exited_guild') {
        console.info('self_exited_guild');

        return KOOKEventKey['GUILD_EXIT'];
      } else if (event.extra.type === 'added_channel') {
        console.info('added_channel');

        return KOOKEventKey['CHANNEL_CREATE'];
      } else if (event.extra.type === 'deleted_channel') {
        console.info('deleted_channel');

        return KOOKEventKey['CHANNEL_DELETE'];
        /**
         * **********
         * 消息变动
         * ********
         */
      } else if (event.extra.type === 'updated_message') {
        // 消息更新
        // EditingData
        console.info('updated_message');

        return KOOKEventKey['MESSAGES_UPDATE'];
      } else if (event.extra.type === 'deleted_message') {
        // 消息删除
        console.info('deleted_message');

        return KOOKEventKey['MESSAGES_DELETE'];
      } else if (event.extra.type === 'pinned_message') {
        // 顶置消息
        // overheadData
        console.info('pinned_message');

        return KOOKEventKey['MESSAGES_PIN'];
      }
    },
    direct: (event: SystemData) => {
      if (event.extra.type === 'guild_member_online') {
        // OnLineData
        console.info('exited_guild');

        return '';
      } else if (event.extra.type === 'message_btn_click') {
        // 按钮事件
        console.info('message_btn_click');

        return KOOKEventKey['INTERACTION'];
      }
    }
  }
};
