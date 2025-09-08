import { createEventValue, EventKeys, useClient as createUseClient, Events } from 'alemonjs';
import { DCAPI as API } from './sdk/api';
import { MESSAGE_CREATE_TYPE } from './sdk/message/MESSAGE_CREATE';
import { INTERACTION_CREATE_TYPE } from './sdk/message/INTERACTION_CREATE';

type MAP = {
  'message.create': MESSAGE_CREATE_TYPE;
  'private.message.create': MESSAGE_CREATE_TYPE;
  'interaction.create': INTERACTION_CREATE_TYPE;
  'private.interaction.create': INTERACTION_CREATE_TYPE;
  'message.update': undefined;
  'message.delete': undefined;
  'message.reaction.add': undefined;
  'message.reaction.remove': undefined;
  'channal.create': undefined;
  'channal.delete': undefined;
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
