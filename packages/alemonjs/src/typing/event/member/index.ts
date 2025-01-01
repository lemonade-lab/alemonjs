import { Guild, Channel } from '../base/guild'
import { Message } from '../base/message'
import { User } from '../base/user'
import { platform } from '../base/platform'
// 成员添加
export type PublicEventMemberAdd = platform &
  Guild &
  Channel &
  Message &
  User & {
    naem: 'member.add'
  }
// 成员移除
export type PublicEventMemberRemove = platform &
  Guild &
  Channel &
  Message &
  User & {
    name: 'member.remove'
  }
