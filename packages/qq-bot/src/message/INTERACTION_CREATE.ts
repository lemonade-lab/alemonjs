import type { QQBotInteractionResolved } from '../sdk/non-channel-types';
/**
 * 交互消息事件 | 按钮消息
 * @param event
 * @returns
 */
export type INTERACTION_CREATE_TYPE =
  | {
      application_id: string;
      event_id?: string; // 网关信封 ID；互动 ACK 仍使用 id
      chat_type?: 1; // 1: 群聊, 2: 私聊
      data: { type?: number; resolved?: QQBotInteractionResolved };
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
      event_id?: string; // 网关信封 ID；互动 ACK 仍使用 id
      chat_type?: 2; // 私聊
      data: { type?: number; resolved?: QQBotInteractionResolved };
      id: string;
      scene: 'c2c';
      timestamp: string; // '2025-06-14T12:20:20+08:00'
      type: number; // 11
      user_openid: string;
      version: number; // 1
    }
  | {
      application_id: string;
      event_id?: string; // 网关信封 ID；互动 ACK 仍使用 id
      chat_type?: 0; // 0: 频道
      data: { type?: number; resolved?: QQBotInteractionResolved };
      id: string;
      scene: 'guild';
      timestamp: string; // '2025-06-14T12:20:20+08:00'
      type: number; // 11
      guild_id: string; // 频道ID
      channel_id: string; // 频道ID
      version: number; // 1
    };
