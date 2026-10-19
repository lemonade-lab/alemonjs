import { User } from "../base/user.js";
import { Message } from "../base/message.js";
import { Platform } from "../base/platform.js";
import { Expansion } from "../base/expansion.js";
//#region src/types/event/request/index.d.ts
type PrivateEventRequestFriendAdd = Platform & Message & User & {
  name: 'private.friend.add';
} & Expansion;
type PrivateEventRequestGuildAdd = Platform & Message & User & {
  name: 'private.guild.add';
} & Expansion;
type PrivateEventRequestFriendRemove = Platform & Message & User & {
  name: 'private.friend.remove';
} & Expansion;
//#endregion
export { PrivateEventRequestFriendAdd, PrivateEventRequestFriendRemove, PrivateEventRequestGuildAdd };