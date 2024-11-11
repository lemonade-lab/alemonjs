import { Guild } from '../base/guild'
import { Message } from '../base/message'
import { platform } from '../base/platform'
// 公有事件-加入频道
export type PublicEventGuildJoin = {} & platform & Guild & Message
// 公有事件-退出频道
export type PublicEventGuildExit = {} & platform & Guild & Message
