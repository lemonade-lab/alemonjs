import { createEventValue, EventKeys, useClient as createUseClient, Events } from 'alemonjs';
import { OneBotAPI as API } from './sdk/api';
import {
  DIRECT_MESSAGE_TYPE,
  MESSAGES_TYPE,
  GROUP_RECALL,
  NOTICE_FRIEND_RECALL_TYPE,
  NOTICE_GROUP_MEMBER_INCREASE_TYPE,
  NOTICE_GROUP_MEMBER_REDUCE_TYPE,
  NOTICE_GROUP_BAN_TYPE,
  REQUEST_FRIEND,
  REQUEST_ADD_GROUP_TYPE,
  NOTICE_GROUP_UPLOAD_TYPE,
  NOTICE_OFFLINE_FILE_TYPE,
  NOTICE_GROUP_ADMIN_TYPE,
  NOTICE_NOTIFY_TYPE
} from './sdk/types';

type MAP = {
  'message.create': MESSAGES_TYPE | NOTICE_GROUP_UPLOAD_TYPE;
  'private.message.create': DIRECT_MESSAGE_TYPE | NOTICE_OFFLINE_FILE_TYPE;
  'interaction.create': undefined;
  'private.interaction.create': undefined;
  'message.update': undefined;
  'message.delete': GROUP_RECALL;
  'message.reaction.add': undefined;
  'message.reaction.remove': undefined;
  'message.pin': undefined;
  'channel.create': undefined;
  'channel.delete': undefined;
  'channel.update': undefined;
  'guild.join': undefined;
  'guild.exit': undefined;
  'guild.update': undefined;
  'member.add': NOTICE_GROUP_MEMBER_INCREASE_TYPE;
  'member.remove': NOTICE_GROUP_MEMBER_REDUCE_TYPE;
  'member.ban': NOTICE_GROUP_BAN_TYPE;
  'member.unban': NOTICE_GROUP_BAN_TYPE;
  'member.update': NOTICE_GROUP_ADMIN_TYPE;
  'notice.create': NOTICE_NOTIFY_TYPE;
  'private.notice.create': undefined;
  'private.message.update': undefined;
  'private.message.delete': NOTICE_FRIEND_RECALL_TYPE;
  'private.friend.add': REQUEST_FRIEND;
  'private.friend.remove': undefined;
  'private.guild.add': REQUEST_ADD_GROUP_TYPE;
};

/**
 * @deprecated 已废弃，请用alemonjs中获取
 * @param event
 * @returns
 */
export const useValue = <T extends EventKeys>(event: Events[T]) => {
  const value = createEventValue<T, MAP>(event);

  return [value] as const;
};

/**
 * @deprecated 已废弃，请用alemonjs中获取
 * @param event
 * @returns
 */
export const useClient = <T extends EventKeys>(event: Events[T]) => {
  const [client] = createUseClient(event, API);
  const value = createEventValue<T, MAP>(event);

  return [client, value] as const;
};
