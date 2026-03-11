import { Guild, Channel } from '../base/guild';
import { Message } from '../base/message';
import { User } from '../base/user';
import { platform } from '../base/platform';
import { Expansion } from '../base/expansion';
// 成员添加
export type PublicEventMemberAdd = platform &
  Guild &
  Channel &
  Message &
  User & {
    name: 'member.add';
  } & Expansion;
// 成员移除
export type PublicEventMemberRemove = platform &
  Guild &
  Channel &
  Message &
  User & {
    name: 'member.remove';
  } & Expansion;
// 成员封禁
export type PublicEventMemberBan = platform &
  Guild &
  Channel &
  Message &
  User & {
    name: 'member.ban';
  } & Expansion;
// 成员解封
export type PublicEventMemberUnban = platform &
  Guild &
  Channel &
  Message &
  User & {
    name: 'member.unban';
  } & Expansion;
