import { Channel } from 'diagnostics_channel'
import { Message, MessageBody } from '../base/message'
import { User } from '../base/user'
import { Guild } from '../base/guild'
import { platform } from '../base/platform'
// 公有事件-消息创建
export type PublicEventMessageCreate = {} & MessageBody &
  platform &
  Guild &
  Channel &
  Message &
  User
// 公有事件-消息更新
export type PublicEventMessageUpdate = {} & platform & Guild & Channel & Message & User
// 公有事件-消息撤回
export type PublicEventMessageDelete = {} & platform & Guild & Channel & Message
// 公有事件-表情添加
export type PublicEventMessageReactionAdd = {} & platform & Guild & Channel & Message
// 公有事件-表情删除
export type PublicEventMessageReactionRemove = {} & platform & Guild & Channel & Message
