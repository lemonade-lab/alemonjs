import { createEventValue, EventKeys, useClient as createUseClient, Events } from 'alemonjs'
import { OneBotAPI as API } from './sdk/api'
import { DIRECT_MESSAGE_TYPE, MESSAGES_TYPE } from './sdk/types'

type MAP = {
  'message.create': MESSAGES_TYPE
  'private.message.create': DIRECT_MESSAGE_TYPE
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
