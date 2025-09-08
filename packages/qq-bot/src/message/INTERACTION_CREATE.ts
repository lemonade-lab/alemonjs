/**
 * 交互消息事件 | 按钮消息
 * @param event
 * @returns
 */
export type INTERACTION_CREATE_TYPE =
  | {
      application_id: string;
      chat_type: 1; // 1: 群聊, 2: 私聊
      data: {
        resolved: {
          button_data: string;
          button_id: number; // 按钮ID
        };
        type: number; // 11: 按钮交互
      };
      group_member_openid: string;
      group_openid: string;
      id: string;
      scene: 'group';
      timestamp: string;
      type: number; // 11
      version: number; // 1
    }
  | {
      application_id: string;
      chat_type: 2; // 私聊
      data: {
        resolved: {
          button_data: string; // 按钮数据
          button_id: number; // 按钮ID
        };
        type: number; // 11
      };
      id: string;
      scene: 'c2c';
      timestamp: string; // '2025-06-14T12:20:20+08:00'
      type: number; // 11
      user_openid: string;
      version: number; // 1
    }
  | {
      application_id: string;
      chat_type: 0; // 0: 频道
      data: {
        resolved: {
          message_id: string; // 消息ID
          button_data: string; // 按钮数据
          button_id: number; // 按钮ID
          user_id: string; // 用户ID
        };
        type: number; // 11
      };
      id: string;
      scene: 'guild';
      timestamp: string; // '2025-06-14T12:20:20+08:00'
      type: number; // 11
      guild_id: string; // 频道ID
      channel_id: string; // 频道ID
      version: number; // 1
    };
