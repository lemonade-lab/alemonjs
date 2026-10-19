import { User } from "../event/base/user.js";
import { Channel, Guild } from "../event/base/guild.js";
//#region src/types/message/mention.d.ts
/**
 * 提及数据
 */
type DataMention = {
  type: 'Mention';
  value?: string;
  options?: {
    belong?: 'user' | 'guild' | 'channel' | 'everyone';
    payload?: User | Guild | Channel | 'everyone';
  };
};
//#endregion
export { DataMention };