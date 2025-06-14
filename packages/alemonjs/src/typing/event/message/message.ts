import { Guild, Channel } from '../base/guild'
import { Message, MessageOpen, MessageText } from '../base/message'
import { User } from '../base/user'
import { platform } from '../base/platform'
import { Expansion } from '../base/expansion'
// 公有事件-消息创建
export type PublicEventMessageCreate = MessageText &
  MessageOpen &
  platform &
  Guild &
  Channel &
  Message &
  User & {
    name: 'message.create'
  } & Expansion
// 公有事件-消息更新
export type PublicEventMessageUpdate = platform &
  Guild &
  Channel &
  Message &
  User & {
    name: 'message.update'
  } & Expansion
// 公有事件-消息撤回
export type PublicEventMessageDelete = platform &
  Guild &
  Channel &
  Message & {
    name: 'message.delete'
  } & Expansion
// 公有事件-表情添加
export type PublicEventMessageReactionAdd = platform &
  Guild &
  Channel &
  Message & {
    name: 'message.reaction.add'
  } & Expansion
// 公有事件-表情删除
export type PublicEventMessageReactionRemove = platform &
  Guild &
  Channel &
  Message & {
    name: 'message.reaction.remove'
  } & Expansion
