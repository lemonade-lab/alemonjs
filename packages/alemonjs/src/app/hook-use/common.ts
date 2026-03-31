import { DataEnums, EventKeys, Events, User, GuildInfo, ChannelInfo, MemberInfo, RoleInfo, PaginationParams, PaginatedResult } from '../../types';
import { ResultCode } from '../../core/variable';
import { ChildrenApp } from '../store';
import { createResult, Result } from '../../core/utils';
import { sendAction } from '../../cbp/processor/actions';
import { sendAPI } from '../../cbp/processor/api';
import { Format } from '../message-format';
import { getCurrentEvent } from '../hook-event-context';

export type { DataEnums, EventKeys, Events, User, GuildInfo, ChannelInfo, MemberInfo, RoleInfo, PaginationParams, PaginatedResult, Result };

export { ResultCode, ChildrenApp, createResult, sendAction, sendAPI, Format, getCurrentEvent };

export type Options = {
  UserId?: string;
  UserKey?: string;
  UserName?: string;
  IsMaster?: boolean;
  IsBot?: boolean;
};

export const getEventOrThrow = <T extends EventKeys>(event?: Events[T]): Events[T] => {
  const currentEvent = event ?? getCurrentEvent<T>();

  if (!currentEvent || typeof currentEvent !== 'object') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid event: event must be an object',
      data: null
    });
    throw new Error('Invalid event: event must be an object');
  }

  return currentEvent;
};
