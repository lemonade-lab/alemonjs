import { DataEnums, EventKeys, Events, User, GuildInfo, ChannelInfo, MemberInfo, RoleInfo, PaginationParams, PaginatedResult } from '../../types';
import { ResultCode } from '../../common/variable';
import { ChildrenApp } from '../runtime/store.js';
import { createResult, Result } from '../../common/utils';
import { sendAction } from '../runtime/cbp/processor/actions.js';
import { sendAPI } from '../runtime/cbp/processor/api.js';
import { Format } from '../format/message-format.js';
import { getCurrentEvent, getCurrentNext, recordEventSendResults, markEventSendAttempt, markEventSendFailure } from '../runtime/hook-event-context.js';

export type { DataEnums, EventKeys, Events, User, GuildInfo, ChannelInfo, MemberInfo, RoleInfo, PaginationParams, PaginatedResult, Result };

export {
  ResultCode,
  ChildrenApp,
  createResult,
  sendAction,
  sendAPI,
  Format,
  getCurrentEvent,
  getCurrentNext,
  recordEventSendResults,
  markEventSendAttempt,
  markEventSendFailure
};

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
