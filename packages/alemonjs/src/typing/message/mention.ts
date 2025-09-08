import { User } from '../event/base/user';
import { Guild, Channel } from '../event/base/guild';
/**
 * 提及数据
 */
export type DataMention = {
  type: 'Mention';
  value?: string;
  options?: {
    belong?: 'user' | 'guild' | 'channel' | 'everyone';
    payload?: User | Guild | Channel | 'everyone';
  };
};
