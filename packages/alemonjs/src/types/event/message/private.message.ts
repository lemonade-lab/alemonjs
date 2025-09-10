import { Expansion } from '../base/expansion';
import { Message, MessageOpen, MessageText } from '../base/message';
import { platform } from '../base/platform';
import { User } from '../base/user';
// 私有消息-消息创建
export type PrivateEventMessageCreate = MessageText &
  MessageOpen &
  platform &
  Message &
  User & {
    name: 'private.message.create';
  } & Expansion;
// 私有消息-消息更新
export type PrivateEventMessageUpdate = platform &
  Message &
  User & {
    name: 'private.message.update';
  } & Expansion;
// 私有消息-消息撤回
export type PrivateEventMessageDelete = platform &
  Message & {
    name: 'private.message.delete';
  } & Expansion;
