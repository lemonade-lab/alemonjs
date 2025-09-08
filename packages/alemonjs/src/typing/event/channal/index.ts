import { Guild, Channel } from '../base/guild';
import { platform } from '../base/platform';
import { Message } from '../base/message';
import { Expansion } from '../base/expansion';
// 公有事件-子频道创建
export type PublicEventChannalCreate = platform &
  Guild &
  Channel &
  Message & {
    name: 'channal.create';
  } & Expansion;
// 公有事件-子频道删除
export type PublicEventChannalDelete = platform &
  Guild &
  Channel &
  Message & {
    name: 'channal.delete';
  } & Expansion;
