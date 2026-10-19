import { User } from "../base/user.js";
import { Message, MessageMedia, MessageOpen, MessageText } from "../base/message.js";
import { Platform } from "../base/platform.js";
import { Expansion } from "../base/expansion.js";
//#region src/types/event/message/private.message.d.ts
type PrivateEventMessageCreate = MessageText & MessageMedia & MessageOpen & Platform & Message & User & {
  name: 'private.message.create';
} & Expansion;
type PrivateEventMessageUpdate = Platform & Message & User & {
  name: 'private.message.update';
} & Expansion;
type PrivateEventMessageDelete = Platform & Message & {
  name: 'private.message.delete';
} & Expansion;
//#endregion
export { PrivateEventMessageCreate, PrivateEventMessageDelete, PrivateEventMessageUpdate };