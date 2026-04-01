import { Expansion } from '../base/expansion';
import { Message, MessageMedia, MessageOpen, MessageText } from '../base/message';
import { Platform } from '../base/platform';
import { User } from '../base/user';
// 私有消息-消息创建
export type PrivateEventMessageCreate = MessageText &
  MessageMedia &
  MessageOpen &
  Platform &
  Message &
  User & {
    name: 'private.message.create';
  } & Expansion;
// 私有消息-消息更新
export type PrivateEventMessageUpdate = Platform &
  Message &
  User & {
    name: 'private.message.update';
  } & Expansion;
// 私有消息-消息撤回
export type PrivateEventMessageDelete = Platform &
  Message & {
    name: 'private.message.delete';
  } & Expansion;
