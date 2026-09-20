import type { QQBotMessageContent, QQBotMessageUser } from '../../sdk/non-channel-types';
export type C2C_MESSAGE_CREATE_TYPE = QQBotMessageContent & {
  author: QQBotMessageUser;
  content: string;
  id: string;
  timestamp: string;
};
