import { createEventValue, EventKeys, Events, useClient as createUseClient } from 'alemonjs'
import { WebSocketServer as API } from 'ws'

type MAP = {
  'message.create': undefined
  'private.message.create': undefined
  'interaction.create': undefined
  'private.interaction.create': undefined
  'message.update': undefined
  'message.delete': undefined
  'message.reaction.add': undefined
  'message.reaction.remove': undefined
  'channal.create': undefined
  'channal.delete': undefined
  'guild.join': undefined
  'guild.exit': undefined
  'member.add': undefined
  'member.remove': undefined
  'private.message.update': undefined
  'private.message.delete': undefined
  'private.friend.add': undefined
  'private.guild.add': undefined
}

/**
 *
 * @param event
 * @returns
 */
export const useValue = <T extends EventKeys>(event: Events[T]) => {
  const value = createEventValue<T, MAP>(event)
  return [value] as const
}

/**
 *
 * @param event
 * @returns
 */
export const useClient = <T extends EventKeys>(event: Events[T]) => {
  const [client] = createUseClient(event, API)
  const value = createEventValue<T, MAP>(event)
  return [client, value] as const
}
