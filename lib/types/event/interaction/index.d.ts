import { User } from "../base/user.js";
import { Channel, Guild } from "../base/guild.js";
import { Message, MessageOpen, MessageText } from "../base/message.js";
import { Platform } from "../base/platform.js";
import { Expansion } from "../base/expansion.js";
import { Interaction } from "../base/interaction.js";
//#region src/types/event/interaction/index.d.ts
type PrivateEventInteractionCreate = MessageText & Interaction & MessageOpen & Platform & Message & User & {
  name: 'private.interaction.create';
} & Expansion;
type PublicEventInteractionCreate = MessageText & Interaction & MessageOpen & Platform & Guild & Channel & Message & User & {
  name: 'interaction.create';
} & Expansion;
//#endregion
export { PrivateEventInteractionCreate, PublicEventInteractionCreate };