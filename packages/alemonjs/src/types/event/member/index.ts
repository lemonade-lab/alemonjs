import { Guild, Channel } from '../base/guild';
import { Message } from '../base/message';
import { User } from '../base/user';
import { Platform } from '../base/platform';
import { Expansion } from '../base/expansion';
// 成员添加
export type PublicEventMemberAdd = Platform &
  Guild &
  Channel &
  Message &
  User & {
    name: 'member.add';
  } & Expansion;
// 成员移除
export type PublicEventMemberRemove = Platform &
  Guild &
  Channel &
  Message &
  User & {
    name: 'member.remove';
  } & Expansion;
// 成员封禁
export type PublicEventMemberBan = Platform &
  Guild &
  Channel &
  Message &
  User & {
    name: 'member.ban';
  } & Expansion;
// 成员解封
export type PublicEventMemberUnban = Platform &
  Guild &
  Channel &
  Message &
  User & {
    name: 'member.unban';
  } & Expansion;
// 成员属性变更（管理员设置/取消、角色变更等）
export type PublicEventMemberUpdate = Platform &
  Guild &
  Channel &
  Message &
  User & {
    name: 'member.update';
  } & Expansion;
