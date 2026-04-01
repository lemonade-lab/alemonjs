import { Guild, Channel } from '../base/guild';
import { Message, MessageOpen, MessageText } from '../base/message';
import { User } from '../base/user';
import { Platform } from '../base/platform';
import { Expansion } from '../base/expansion';
// 私有消息-交互创建
export type PrivateEventInteractionCreate = MessageText &
  MessageOpen &
  Platform &
  Message &
  User & {
    name: 'private.interaction.create';
  } & Expansion;

// 公有事件-交互创建
export type PublicEventInteractionCreate = MessageText &
  MessageOpen &
  Platform &
  Guild &
  Channel &
  Message &
  User & {
    name: 'interaction.create';
  } & Expansion;
