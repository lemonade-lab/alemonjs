import { createEventValue, EventKeys, Events, useClient as createUseClient } from 'alemonjs';
import { GROUP_AT_MESSAGE_CREATE_TYPE } from './message/group/GROUP_AT_MESSAGE_CREATE';
import { QQBotAPI as API } from './sdk/api';
import { AT_MESSAGE_CREATE_TYPE } from './message/AT_MESSAGE_CREATE';
import { INTERACTION_CREATE_TYPE } from './message/INTERACTION_CREATE';
import { DIRECT_MESSAGE_CREATE_TYPE } from './message/DIRECT_MESSAGE_CREATE';
import { C2C_MESSAGE_CREATE_TYPE } from './message/group/C2C_MESSAGE_CREATE';
import { MESSAGE_CREATE_TYPE } from './message/MESSAGE_CREATE';
import { MESSAGE_DELETE_TYPE } from './message/MESSAGE_DELETE';
import { PUBLIC_MESSAGE_DELETE_TYPE } from './message/PUBLIC_MESSAGE_DELETE';
import { DIRECT_MESSAGE_DELETE_TYPE } from './message/DIRECT_MESSAGE_DELETE';
import { MESSAGE_REACTION_ADD_TYPE } from './message/MESSAGE_REACTION_ADD';
import { MESSAGE_REACTION_REMOVE_TYPE } from './message/MESSAGE_REACTION_REMOVE';
import { CHANNEL_CREATE_TYPE } from './message/CHANNEL_CREATE';
import { CHANNEL_DELETE_TYPE } from './message/CHANNEL_DELETE';
import { CHANNEL_UPDATE_TYPE } from './message/CHANNEL_UPDATE';
import { GUILD_CREATE_TYPE } from './message/GUILD_CREATE';
import { GUILD_DELETE_TYPE } from './message/GUILD_DELETE';
import { GUILD_UPDATE_TYPE } from './message/GUILD_UPDATE';
import { GUILD_MEMBER_ADD_TYPE } from './message/GUILD_MEMBER_ADD';
import { GUILD_MEMBER_REMOVE_TYPE } from './message/GUILD_MEMBER_REMOVE';
import { GUILD_MEMBER_UPDATE_TYPE } from './message/GUILD_MEMBER_UPDATE';
import { GROUP_ADD_ROBOT_TYPE } from './message/group/GROUP_ADD_ROBOT';
import { GROUP_DEL_ROBOT_TYPE } from './message/group/GROUP_DEL_ROBOT';
import { FRIEND_ADD_TYPE } from './message/group/FRIEND_ADD';
import { FRIEND_DEL_TYPE } from './message/group/FRIEND_DEL';
import { GROUP_MSG_RECEIVE_TYPE } from './message/group/GROUP_MSG_RECEIVE';
import { GROUP_MSG_REJECT_TYPE } from './message/group/GROUP_MSG_REJECT';
import { C2C_MSG_RECEIVE_TYPE } from './message/group/C2C_MSG_RECEIVE';
import { C2C_MSG_REJECT_TYPE } from './message/group/C2C_MSG_REJECT';

type MAP = {
  'message.create': GROUP_AT_MESSAGE_CREATE_TYPE | AT_MESSAGE_CREATE_TYPE | MESSAGE_CREATE_TYPE;
  'private.message.create': DIRECT_MESSAGE_CREATE_TYPE | C2C_MESSAGE_CREATE_TYPE;
  'interaction.create': INTERACTION_CREATE_TYPE;
  'private.interaction.create': INTERACTION_CREATE_TYPE;
  'message.update': undefined;
  'message.delete': MESSAGE_DELETE_TYPE | PUBLIC_MESSAGE_DELETE_TYPE;
  'message.reaction.add': MESSAGE_REACTION_ADD_TYPE;
  'message.reaction.remove': MESSAGE_REACTION_REMOVE_TYPE;
  'message.pin': undefined;
  'channel.create': CHANNEL_CREATE_TYPE;
  'channel.delete': CHANNEL_DELETE_TYPE;
  'channel.update': CHANNEL_UPDATE_TYPE;
  'guild.join': GUILD_CREATE_TYPE | GROUP_ADD_ROBOT_TYPE;
  'guild.exit': GUILD_DELETE_TYPE | GROUP_DEL_ROBOT_TYPE;
  'guild.update': GUILD_UPDATE_TYPE;
  'member.add': GUILD_MEMBER_ADD_TYPE;
  'member.remove': GUILD_MEMBER_REMOVE_TYPE;
  'member.ban': undefined;
  'member.unban': undefined;
  'member.update': GUILD_MEMBER_UPDATE_TYPE;
  'notice.create': GROUP_MSG_RECEIVE_TYPE | GROUP_MSG_REJECT_TYPE;
  'private.message.update': undefined;
  'private.message.delete': DIRECT_MESSAGE_DELETE_TYPE;
  'private.friend.add': FRIEND_ADD_TYPE;
  'private.friend.remove': FRIEND_DEL_TYPE;
  'private.guild.add': undefined;
  'private.notice.create': C2C_MSG_RECEIVE_TYPE | C2C_MSG_REJECT_TYPE;
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

/**
 * 判断当前模式
 * @param event
 * @returns
 */
export const useMode = <T extends EventKeys>(event: Events[T]) => {
  const tag = event._tag;
  let currentMode = 'group';

  // 群at
  if (tag === 'GROUP_AT_MESSAGE_CREATE') {
    currentMode = 'group';
  }
  // 私聊
  if (tag === 'C2C_MESSAGE_CREATE') {
    currentMode = 'c2c';
  }
  // 频道私聊
  if (tag === 'DIRECT_MESSAGE_CREATE') {
    currentMode = 'guild';
  }
  // 频道at
  if (tag === 'AT_MESSAGE_CREATE') {
    currentMode = 'guild';
  }
  // 频道消息
  if (tag === 'MESSAGE_CREATE') {
    currentMode = 'guild';
  }
  const isMode = (mode: 'guild' | 'group' | 'c2c') => {
    return currentMode === mode;
  };

  return isMode;
};
