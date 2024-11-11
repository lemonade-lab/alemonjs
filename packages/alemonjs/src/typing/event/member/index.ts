import { Channel } from 'diagnostics_channel'
import { Message } from '../base/message'
import { User } from '../base/user'
import { Guild } from '../base/guild'
import { platform } from '../base/platform'
// 成员添加
export type PublicEventMemberAdd = {} & platform & Guild & Channel & Message & User
// 成员移除
export type PublicEventMemberRemove = {} & platform & Guild & Channel & Message & User
