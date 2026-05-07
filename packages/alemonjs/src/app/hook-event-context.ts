import { AsyncLocalStorage } from 'node:async_hooks';
import { performance } from 'node:perf_hooks';
import { getConfigValue } from '../core/config';
import { ResultCode } from '../core/variable';
import { EventKeys, Events } from '../types';

export type EventTraceReason = 'filtered' | 'completed' | 'consumed' | 'error';

type EventTrace<T extends EventKeys = EventKeys> = {
  select: T;
  startTime: number;
  ended: boolean;
  finish: (reason: EventTraceReason) => void;
};

type EventContext<T extends EventKeys = EventKeys> = {
  event: Events[T];
  next?: (...args: boolean[]) => void;
  trace?: EventTrace<T>;
};

const eventStore = new AsyncLocalStorage<EventContext>();

const shouldShowLog = <T extends EventKeys>(event: Events[T]) => {
  const value = getConfigValue() ?? {};

  if (Array.isArray(value?.logs?.channel_id)) {
    const channelIds = value.logs.channel_id;

    return channelIds.length > 0 && channelIds.includes(event['ChannelId']);
  }

  return true;
};

const createLogData = <T extends EventKeys>(event: Events[T], select: T, reason: EventTraceReason, duration: number) => {
  const log: {
    [key: string]: string | number | boolean;
  } = {
    Name: select,
    reason,
    duration
  };

  for (const key in event) {
    if (Object.prototype.hasOwnProperty.call(event, key)) {
      const value = event[key];

      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        log[key] = value;
      }
    }
  }

  return log;
};

const createLogText = <T extends EventKeys>(event: Events[T], select: T, reason: EventTraceReason, duration: number) => {
  const parts = [`[Name:${select}]`, `[Reason:${reason}]`, `[Duration:${duration}ms]`];
  const fields = ['GuildId', 'ChannelId', 'UserKey', 'UserId', 'MessageId', 'MessageText'] as const;

  for (const f of fields) {
    const v = event[f];

    if (typeof v === 'string' && v !== '') {
      parts.push(`[${f}:${v}]`);
    }
  }

  return parts.join('');
};

const createEventTrace = <T extends EventKeys>(select: T): EventTrace<T> => {
  const trace: EventTrace<T> = {
    select,
    startTime: performance.now(),
    ended: false,
    finish(reason) {
      if (trace.ended) {
        return;
      }

      trace.ended = true;

      const store = eventStore.getStore();
      const event = store?.event as Events[T];
      const duration = Number((performance.now() - trace.startTime).toFixed(2));

      if (!event || !shouldShowLog(event)) {
        return;
      }

      if (process.env.NODE_ENV === 'development') {
        logger.debug({
          code: ResultCode.Ok,
          message: 'event processor finished',
          data: createLogData(event, trace.select, reason, duration)
        });

        return;
      }

      logger.info(createLogText(event, trace.select, reason, duration));
    }
  };

  return trace;
};

/**
 * 在当前异步调用链中绑定事件上下文。
 */
export const withEventContext = <T extends EventKeys, R>(event: Events[T], next: (...args: boolean[]) => void, runner: () => R): R => {
  const current = eventStore.getStore();

  return eventStore.run(
    {
      event,
      next,
      trace: current?.trace as EventTrace<T> | undefined
    },
    runner
  );
};

/**
 * 为当前消息处理创建一条带计时的上下文链。
 */
export const withProcessorTrace = <T extends EventKeys, R>(select: T, event: Events[T], runner: () => R): R => {
  const current = eventStore.getStore();

  return eventStore.run(
    {
      event,
      next: current?.next,
      trace: current?.trace ?? createEventTrace(select)
    },
    runner
  );
};

/**
 * 读取当前异步调用链中的事件上下文。
 */
export const getCurrentEvent = <T extends EventKeys>(): Events[T] | undefined => {
  return eventStore.getStore()?.event as Events[T] | undefined;
};

/**
 * 读取当前异步调用链中的 next 回调。
 */
export const getCurrentNext = (): ((...args: boolean[]) => void) | undefined => {
  return eventStore.getStore()?.next;
};

/**
 * 结束当前消息处理计时。
 */
export const finishCurrentTrace = (reason: EventTraceReason) => {
  eventStore.getStore()?.trace?.finish(reason);
};
