import { Guild, Channel } from '../base/guild'
import { Message, MessageOpen, MessageText } from '../base/message'
import { User } from '../base/user'
import { platform } from '../base/platform'
// 私有消息-交互创建
export type PrivateEventInteractionCreate = MessageText &
  MessageOpen &
  platform &
  Message &
  User & {
    name: 'private.interaction.create'
  }

// 公有事件-交互创建
export type PublicEventInteractionCreate = MessageText &
  MessageOpen &
  platform &
  Guild &
  Channel &
  Message &
  User & {
    name: 'interaction.create'
  }
