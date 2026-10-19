import { Channel, Guild } from "../base/guild.js";
import { Message } from "../base/message.js";
import { Platform } from "../base/platform.js";
import { Expansion } from "../base/expansion.js";
//#region src/types/event/channel/index.d.ts
type PublicEventChannelCreate = Platform & Guild & Channel & Message & {
  name: 'channel.create';
} & Expansion;
type PublicEventChannelDelete = Platform & Guild & Channel & Message & {
  name: 'channel.delete';
} & Expansion;
type PublicEventChannelUpdate = Platform & Guild & Channel & Message & {
  name: 'channel.update';
} & Expansion;
//#endregion
export { PublicEventChannelCreate, PublicEventChannelDelete, PublicEventChannelUpdate };