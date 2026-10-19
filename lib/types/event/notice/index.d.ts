import { User } from "../base/user.js";
import { Channel, Guild } from "../base/guild.js";
import { Message } from "../base/message.js";
import { Platform } from "../base/platform.js";
import { Expansion } from "../base/expansion.js";
//#region src/types/event/notice/index.d.ts
type PublicEventNoticeCreate = Platform & Guild & Channel & Message & User & {
  name: 'notice.create';
} & Expansion;
type PrivateEventNoticeCreate = Platform & Message & User & {
  name: 'private.notice.create';
} & Expansion;
//#endregion
export { PrivateEventNoticeCreate, PublicEventNoticeCreate };