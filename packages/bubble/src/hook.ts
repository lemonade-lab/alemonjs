import { createEventValue, EventKeys, useClient as createUseClient, Events } from 'alemonjs';
import { BubbleAPI as API } from './sdk/api';

type MAP = {
  'message.create': object;
  'private.message.create': object;
  'interaction.create': object;
  'private.interaction.create': object;
  'message.update': undefined;
  'message.delete': undefined;
  'message.reaction.add': undefined;
  'message.reaction.remove': undefined;
  'channel.create': undefined;
  'channel.delete': undefined;
  'guild.join': undefined;
  'guild.exit': undefined;
  'member.add': undefined;
  'member.remove': undefined;
  'private.message.update': undefined;
  'private.message.delete': undefined;
  'private.friend.add': undefined;
  'private.guild.add': undefined;
};

/**
 *
 * @param event
 * @returns
 */
export const useValue = <T extends EventKeys>(event: Events[T]) => {
  const value = createEventValue<T, MAP>(event);

  return [value] as const;
};

/**
 *
 * @param event
 * @returns
 */
export const useClient = <T extends EventKeys>(event: Events[T]) => {
  const [client] = createUseClient(event, API);
  const value = createEventValue<T, MAP>(event);

  return [client, value] as const;
};
