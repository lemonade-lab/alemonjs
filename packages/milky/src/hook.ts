import { createEventValue, EventKeys, useClient as createUseClient, Events } from 'alemonjs';
import { MilkyAPI as API } from './sdk/api';
import type { MilkyEvent } from './sdk/types';

type MAP = {
  'message.create': MilkyEvent;
  'private.message.create': MilkyEvent;
  'interaction.create': MilkyEvent;
  'private.interaction.create': MilkyEvent;
  'message.update': MilkyEvent;
  'message.delete': MilkyEvent;
  'message.reaction.add': MilkyEvent;
  'message.reaction.remove': MilkyEvent;
  'message.pin': MilkyEvent;
  'channel.create': MilkyEvent;
  'channel.delete': MilkyEvent;
  'channel.update': MilkyEvent;
  'guild.join': MilkyEvent;
  'guild.exit': MilkyEvent;
  'guild.update': MilkyEvent;
  'member.add': MilkyEvent;
  'member.remove': MilkyEvent;
  'member.ban': MilkyEvent;
  'member.unban': MilkyEvent;
  'member.update': MilkyEvent;
  'notice.create': MilkyEvent;
  'private.notice.create': MilkyEvent;
  'private.message.update': MilkyEvent;
  'private.message.delete': MilkyEvent;
  'private.friend.add': MilkyEvent;
  'private.friend.remove': MilkyEvent;
  'private.guild.add': MilkyEvent;
};

/**
 * @deprecated 已废弃，请用 alemonjs 中获取
 * @param event
 * @returns
 */
export const useValue = <T extends EventKeys>(event: Events[T]) => {
  const value = createEventValue<T, MAP>(event);

  return [value] as const;
};

/**
 * @deprecated 已废弃，请用 alemonjs 中获取
 * @param event
 * @returns
 */
export const useClient = <T extends EventKeys>(event: Events[T]) => {
  const [client] = createUseClient(event, API);
  const value = createEventValue<T, MAP>(event);

  return [client, value] as const;
};
