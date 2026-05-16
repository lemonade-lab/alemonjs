import { logger } from '../../common/logger.js';
import { ResultCode } from '../../common/variable.js';
import { sendAPI } from '../runtime/cbp/processor/api.js';
import { EventKeys, Events } from '../../types/index.js';
import { getCurrentEvent } from '../runtime/hook-event-context.js';

const createDeepProxy = <T extends object>(event: unknown, path: string[] = []): T => {
  return new Proxy((() => {}) as unknown as T, {
    get(_target, prop) {
      if (typeof prop === 'symbol') {
        return undefined;
      }

      return createDeepProxy(event, [...path, String(prop)]);
    },
    apply(_target, _thisArg, args) {
      return sendAPI({
        action: 'client.api',
        payload: {
          event,
          key: path.join('.'),
          params: args
        }
      });
    }
  });
};

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

  const client = createDeepProxy<T>(valueEvent);

  return [client] as const;
}
