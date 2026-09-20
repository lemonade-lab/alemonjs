import type { QQBotMessageContent, QQBotMessageUser } from '../../sdk/non-channel-types';
/**
 * 群消息事件 AT 事件
 */
export interface GROUP_AT_MESSAGE_CREATE_TYPE extends QQBotMessageContent {
  author: QQBotMessageUser;
  content: string;
  group_openid: string;
  group_id?: string;
  id: string;
  mentions?: (QQBotMessageUser & { is_you?: boolean; scope?: string })[];
  timestamp: string;
}
