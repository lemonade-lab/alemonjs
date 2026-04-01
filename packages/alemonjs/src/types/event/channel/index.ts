import { Guild, Channel } from '../base/guild';
import { Platform } from '../base/platform';
import { Message } from '../base/message';
import { Expansion } from '../base/expansion';
// 公有事件-子频道创建
export type PublicEventChannelCreate = Platform &
  Guild &
  Channel &
  Message & {
    name: 'channel.create';
  } & Expansion;
// 公有事件-子频道删除
export type PublicEventChannelDelete = Platform &
  Guild &
  Channel &
  Message & {
    name: 'channel.delete';
  } & Expansion;
// 公有事件-子频道更新
export type PublicEventChannelUpdate = Platform &
  Guild &
  Channel &
  Message & {
    name: 'channel.update';
  } & Expansion;
