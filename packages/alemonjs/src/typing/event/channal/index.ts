import { Guild, Channel } from '../base/guild'
import { platform } from '../base/platform'
import { Message } from '../base/message'
// 公有事件-子频道创建
export type PublicEventChannalCreate = platform &
  Guild &
  Channel &
  Message & {
    name: 'channal.create'
  }
// 公有事件-子频道删除
export type PublicEventChannalDelete = platform &
  Guild &
  Channel &
  Message & {
    name: 'channal.delete'
  }
