import { EventKeys, Events, getCurrentEvent, ResultCode, sendAPI } from './common';

/**
 * 使用客户端
 *
 * useClient()                 — 无参，event 从上下文取
 * useClient(ApiClass)         — 传构造函数，event 从上下文取
 * useClient(event)            — 显式 event
 * useClient(event, ApiClass)  — 显式 event + 构造函数
 */
export function useClient<T extends object, K extends EventKeys = EventKeys>(
  eventOrClass?: Events[K] | (new (...args: any[]) => T),
  _ApiClass?: new (...args: any[]) => T
) {
  let valueEvent: Events[K] | undefined;

  if (eventOrClass !== undefined && typeof eventOrClass === 'function') {
    valueEvent = getCurrentEvent<K>();
  } else {
    valueEvent = (eventOrClass as Events[K] | undefined) ?? getCurrentEvent<K>();
  }

  if (!valueEvent || typeof valueEvent !== 'object') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid event: event must be an object',
      data: null
    });
    throw new Error('Invalid event: event must be an object');
  }

  const client = new Proxy({} as T, {
    get(_target, prop) {
      if (typeof prop === 'symbol') {
        return undefined;
      }

      return (...args: any[]) => {
        return sendAPI({
          action: 'client.api',
          payload: {
            event: valueEvent,
            key: String(prop),
            params: args
          }
        });
      };
    }
  });

  return [client] as const;
}
