import { Guild, Channel } from '../base/guild'
import { Message, MessageOpen, MessageText } from '../base/message'
import { User } from '../base/user'
import { platform } from '../base/platform'
import { Expansion } from '../base/expansion'
// 私有消息-交互创建
export type PrivateEventInteractionCreate = MessageText &
  MessageOpen &
  platform &
  Message &
  User & {
    name: 'private.interaction.create'
  } & Expansion

// 公有事件-交互创建
export type PublicEventInteractionCreate = MessageText &
  MessageOpen &
  platform &
  Guild &
  Channel &
  Message &
  User & {
    name: 'interaction.create'
  } & Expansion
