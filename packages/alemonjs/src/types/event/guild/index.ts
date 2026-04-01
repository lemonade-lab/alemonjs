import { Expansion } from '../base/expansion';
import { Channel, Guild } from '../base/guild';
import { Message } from '../base/message';
import { Platform } from '../base/platform';
import { User } from '../base/user';
// 公有事件-加入频道
export type PublicEventGuildJoin = Platform &
  Guild &
  Channel &
  Message &
  User & {
    name: 'guild.join';
  } & Expansion;
// 公有事件-退出频道
export type PublicEventGuildExit = Platform &
  Guild &
  Channel &
  Message &
  User & {
    name: 'guild.exit';
  } & Expansion;
// 公有事件-频道更新
export type PublicEventGuildUpdate = Platform &
  Guild &
  Channel &
  Message & {
    name: 'guild.update';
  } & Expansion;
