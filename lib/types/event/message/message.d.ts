import { User } from "../base/user.js";
import { Channel, Guild } from "../base/guild.js";
import { Message, MessageMedia, MessageOpen, MessageText } from "../base/message.js";
import { Platform } from "../base/platform.js";
import { Expansion } from "../base/expansion.js";
//#region src/types/event/message/message.d.ts
type PublicEventMessageCreate = MessageText & MessageMedia & MessageOpen & Platform & Guild & Channel & Message & User & {
  name: 'message.create';
} & Expansion;
type PublicEventMessageUpdate = Platform & Guild & Channel & Message & User & {
  name: 'message.update';
} & Expansion;
type PublicEventMessageDelete = Platform & Guild & Channel & Message & {
  name: 'message.delete';
} & Expansion;
type PublicEventMessageReactionAdd = Platform & Guild & Channel & Message & {
  name: 'message.reaction.add';
} & Expansion;
type PublicEventMessageReactionRemove = Platform & Guild & Channel & Message & {
  name: 'message.reaction.remove';
} & Expansion;
type PublicEventMessagePin = Platform & Guild & Channel & Message & {
  name: 'message.pin';
} & Expansion;
//#endregion
export { PublicEventMessageCreate, PublicEventMessageDelete, PublicEventMessagePin, PublicEventMessageReactionAdd, PublicEventMessageReactionRemove, PublicEventMessageUpdate };