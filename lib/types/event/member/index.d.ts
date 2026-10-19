import { User } from "../base/user.js";
import { Channel, Guild } from "../base/guild.js";
import { Message } from "../base/message.js";
import { Platform } from "../base/platform.js";
import { Expansion } from "../base/expansion.js";
//#region src/types/event/member/index.d.ts
type PublicEventMemberAdd = Platform & Guild & Channel & Message & User & {
  name: 'member.add';
} & Expansion;
type PublicEventMemberRemove = Platform & Guild & Channel & Message & User & {
  name: 'member.remove';
} & Expansion;
type PublicEventMemberBan = Platform & Guild & Channel & Message & User & {
  name: 'member.ban';
} & Expansion;
type PublicEventMemberUnban = Platform & Guild & Channel & Message & User & {
  name: 'member.unban';
} & Expansion;
type PublicEventMemberUpdate = Platform & Guild & Channel & Message & User & {
  name: 'member.update';
} & Expansion;
//#endregion
export { PublicEventMemberAdd, PublicEventMemberBan, PublicEventMemberRemove, PublicEventMemberUnban, PublicEventMemberUpdate };