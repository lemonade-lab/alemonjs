import { User } from "../base/user.js";
import { Channel, Guild } from "../base/guild.js";
import { Message } from "../base/message.js";
import { Platform } from "../base/platform.js";
import { Expansion } from "../base/expansion.js";
//#region src/types/event/guild/index.d.ts
type PublicEventGuildJoin = Platform & Guild & Channel & Message & User & {
  name: 'guild.join';
} & Expansion;
type PublicEventGuildExit = Platform & Guild & Channel & Message & User & {
  name: 'guild.exit';
} & Expansion;
type PublicEventGuildUpdate = Platform & Guild & Channel & Message & {
  name: 'guild.update';
} & Expansion;
//#endregion
export { PublicEventGuildExit, PublicEventGuildJoin, PublicEventGuildUpdate };