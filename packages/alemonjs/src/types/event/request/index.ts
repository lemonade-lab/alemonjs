import { Expansion } from '../base/expansion';
import { Message } from '../base/message';
import { Platform } from '../base/platform';
import { User } from '../base/user';
// 私有消息-朋友添加请求
export type PrivateEventRequestFriendAdd = Platform &
  Message &
  User & {
    name: 'private.friend.add';
  } & Expansion;
// 私有消息-频道添加请求
export type PrivateEventRequestGuildAdd = Platform &
  Message &
  User & {
    name: 'private.guild.add';
  } & Expansion;
// 私有消息-好友删除
export type PrivateEventRequestFriendRemove = Platform &
  Message &
  User & {
    name: 'private.friend.remove';
  } & Expansion;
