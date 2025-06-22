import { createEventValue, EventKeys, Events, useClient as createUseClient } from 'alemonjs'
import { GROUP_AT_MESSAGE_CREATE_TYPE } from './message/group/GROUP_AT_MESSAGE_CREATE'
import { QQBotAPI as API } from './sdk/api'
import { AT_MESSAGE_CREATE_TYPE } from './message/AT_MESSAGE_CREATE'
import { INTERACTION_CREATE_TYPE } from './message/INTERACTION_CREATE'
import { DIRECT_MESSAGE_CREATE_TYPE } from './message/DIRECT_MESSAGE_CREATE'
import { C2C_MESSAGE_CREATE_TYPE } from './message/group/C2C_MESSAGE_CREATE'

type MAP = {
  'message.create': GROUP_AT_MESSAGE_CREATE_TYPE | AT_MESSAGE_CREATE_TYPE
  'private.message.create': DIRECT_MESSAGE_CREATE_TYPE | C2C_MESSAGE_CREATE_TYPE
  'interaction.create': INTERACTION_CREATE_TYPE
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

/**
 * 判断当前模式
 * @param event
 * @returns
 */
export const useMode = <T extends EventKeys>(event: Events[T]) => {
  const tag = event.tag
  let currentMode = 'group'
  // 群at
  if (tag == 'GROUP_AT_MESSAGE_CREATE') {
    currentMode = 'group'
  }
  // 私聊
  if (tag == 'C2C_MESSAGE_CREATE') {
    currentMode = 'group'
  }
  // 频道私聊
  if (tag == 'DIRECT_MESSAGE_CREATE') {
    currentMode = 'guild'
  }
  // 频道at
  if (tag == 'AT_MESSAGE_CREATE') {
    currentMode = 'guild'
  }
  // 频道消息
  if (tag == 'MESSAGE_CREATE') {
    currentMode = 'guild'
  }
  const isMode = (mode: 'guild' | 'group') => {
    return currentMode == mode
  }
  return isMode
}
