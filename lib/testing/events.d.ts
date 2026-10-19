import { User } from "../types/event/base/user.js";
import { Channel, Guild } from "../types/event/base/guild.js";
import { Message, MessageMedia, MessageOpen, MessageText } from "../types/event/base/message.js";
import { StandardEventDetails } from "../types/messaging.js";
import { Expansion } from "../types/event/base/expansion.js";
import { Interaction } from "../types/event/base/interaction.js";
import { AutoFields } from "../types/event/base/auto.js";
import { EventKeys, Events } from "../types/event/map.js";
import "../types/index.js";
import "../index.js";
//#region src/testing/events.d.ts
type TestEventOptions = {
  text?: string;
  userId?: string;
  groupId?: string;
  channelId?: string;
  botId?: string;
  platform?: string;
  messageId?: string;
};
/** Framework fields are defaults; overrides allow adapter-specific payloads. */
declare function createTestEvents(now?: () => number): {
  event: <T extends EventKeys>(name: T, overrides?: Partial<Events[T]>) => Events[T];
  groupMessage: (options?: TestEventOptions, overrides?: Partial<Events['message.create']>) => MessageText & MessageMedia & MessageOpen & StandardEventDetails & {
    Platform: string;
    value: any;
    BotId?: string;
    IsAtMe?: boolean;
    IsPrivate?: boolean;
  } & Guild & Channel & Message & User & {
    name: 'message.create';
  } & Expansion & AutoFields;
  channelMessage: (options?: TestEventOptions, overrides?: Partial<Events['message.create']>) => MessageText & MessageMedia & MessageOpen & StandardEventDetails & {
    Platform: string;
    value: any;
    BotId?: string;
    IsAtMe?: boolean;
    IsPrivate?: boolean;
  } & Guild & Channel & Message & User & {
    name: 'message.create';
  } & Expansion & AutoFields;
  privateMessage: (options?: TestEventOptions, overrides?: Partial<Events['private.message.create']>) => MessageText & MessageMedia & MessageOpen & StandardEventDetails & {
    Platform: string;
    value: any;
    BotId?: string;
    IsAtMe?: boolean;
    IsPrivate?: boolean;
  } & Message & User & {
    name: 'private.message.create';
  } & Expansion & AutoFields;
  interaction: (options?: TestEventOptions & {
    private?: boolean;
  }, overrides?: Partial<Events['interaction.create']>) => (MessageText & Interaction & MessageOpen & StandardEventDetails & {
    Platform: string;
    value: any;
    BotId?: string;
    IsAtMe?: boolean;
    IsPrivate?: boolean;
  } & Message & User & {
    name: 'private.interaction.create';
  } & Expansion & AutoFields) | (MessageText & Interaction & MessageOpen & StandardEventDetails & {
    Platform: string;
    value: any;
    BotId?: string;
    IsAtMe?: boolean;
    IsPrivate?: boolean;
  } & Guild & Channel & Message & User & {
    name: 'interaction.create';
  } & Expansion & AutoFields);
};
//#endregion
export { TestEventOptions, createTestEvents };