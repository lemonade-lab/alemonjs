import { EventCycleEnum, Current, Events, EventKeys } from '../../types';
import { ResultCode } from '../../core/variable';
import { SubscribeList } from '../store';
import { SubscribeStatus } from '../config';
import { getCurrentEvent } from '../hook-event-context';

type KeyMap = {
  [key: string]: string | number | boolean;
};

/**
 * 订阅事件
 * @param eventOrSelects
 * @param maybeSelects
 * @returns
 */
export function useSubscribe<T extends EventKeys>(
  selects: T | T[]
): readonly [
  {
    create: (callback: Current<T>, keys: (keyof Events[T])[]) => { id: string; selects: T[]; choose: EventCycleEnum };
    mount: (callback: Current<T>, keys: (keyof Events[T])[]) => { id: string; selects: T[]; choose: EventCycleEnum };
    unmount: (callback: Current<T>, keys: (keyof Events[T])[]) => { id: string; selects: T[]; choose: EventCycleEnum };
    cancel: (value: { id: string; selects: T[]; choose: EventCycleEnum }) => void;
  }
];
export function useSubscribe<T extends EventKeys>(
  event: Events[T] | undefined,
  selects: T | T[]
): readonly [
  {
    create: (callback: Current<T>, keys: (keyof Events[T])[]) => { id: string; selects: T[]; choose: EventCycleEnum };
    mount: (callback: Current<T>, keys: (keyof Events[T])[]) => { id: string; selects: T[]; choose: EventCycleEnum };
    unmount: (callback: Current<T>, keys: (keyof Events[T])[]) => { id: string; selects: T[]; choose: EventCycleEnum };
    cancel: (value: { id: string; selects: T[]; choose: EventCycleEnum }) => void;
  }
];
export function useSubscribe<T extends EventKeys>(eventOrSelects: Events[T] | T | T[] | undefined, maybeSelects?: T | T[]) {
  const selects = (maybeSelects === undefined ? eventOrSelects : maybeSelects) as T | T[];
  const event = (maybeSelects === undefined ? undefined : eventOrSelects) as Events[T] | undefined;
  const valueEvent = event ?? getCurrentEvent<T>();

  // 检查参数
  if (typeof valueEvent !== 'object' || valueEvent === null) {
    logger.error({
      code: ResultCode.FailParams,
      message: 'event is not object',
      data: null
    });
    throw new Error('event is not object');
  }
  if (typeof selects !== 'string' && !Array.isArray(selects)) {
    logger.error({
      code: ResultCode.FailParams,
      message: 'select is not string or array',
      data: null
    });
    throw new Error('select is not string or array');
  }

  type Keys = keyof Events[T];

  /**
   * 运行订阅
   * @param callback
   * @param keys
   * @param choose
   * @returns
   */
  const register = (callback: Current<T>, keys: Keys[], choose: EventCycleEnum) => {
    const curSelects = Array.isArray(selects) ? selects : [selects];
    // 分配id
    const ID = Date.now().toString(36) + Math.random().toString(36).substring(2, 15);

    // 没有选择任何 key，无法绑定订阅
    if (keys.length === 0) {
      logger.warn({
        code: ResultCode.FailParams,
        message: 'subscribe keys is empty',
        data: null
      });

      return { selects: curSelects, choose, id: ID };
    }

    // 创建 订阅 列表
    for (const select of curSelects) {
      const subList = new SubscribeList(choose, select);
      // 只能选择基础数据类型的key
      const values: KeyMap = {};

      for (const key of keys) {
        if (typeof key === 'string' && (typeof valueEvent[key] === 'string' || typeof valueEvent[key] === 'number' || typeof valueEvent[key] === 'boolean')) {
          values[key] = valueEvent[key];
        } else {
          logger.warn({
            code: ResultCode.FailParams,
            message: `Invalid key: ${key?.toString()} must be a string, number or boolean`,
            data: null
          });
        }
      }
      subList.value.append({
        choose,
        selects: curSelects,
        keys: values,
        current: callback,
        status: SubscribeStatus.active,
        id: ID
      });
    }

    return {
      selects: curSelects,
      choose,
      id: ID
    };
  };

  /**
   * res 创建时 运行订阅
   * @param callback
   * @param keys
   */
  const create = (callback: Current<T>, keys: Keys[]) => {
    return register(callback, keys, 'create');
  };

  /**
   * res 挂载时 运行订阅
   * @param callback
   * @param keys
   */
  const mountBefore = (callback: Current<T>, keys: Keys[]) => {
    return register(callback, keys, 'mount');
  };

  /**
   * res 卸载时 运行订阅
   * @param callback
   * @param keys
   */
  const unmount = (callback: Current<T>, keys: Keys[]) => {
    return register(callback, keys, 'unmount');
  };

  /**
   * 清除订阅
   * @param id
   */
  const cancel = (value: { id: string; selects: T[]; choose: EventCycleEnum }) => {
    const selects = value.selects;
    const ID = value.id; // 订阅的 ID

    for (const select of selects) {
      const subList = new SubscribeList(value.choose, select);

      subList.value.forEach(node => {
        if (node.data.id === ID) {
          node.data.status = SubscribeStatus.paused; // 标记为已暂停

          return true; // break
        }
      });
    }
  };

  const subscribe = {
    create,
    mount: mountBefore,
    unmount,
    cancel
  };

  return [subscribe] as const;
}

/**
 * 使用观察者模式订阅事件
 * @param event
 * @param selects
 * @returns
 * 废弃，请使用 useSubscribe
 * @deprecated
 */
export function useObserver<T extends EventKeys>(
  selects: T | T[]
): readonly [
  (callback: Current<T>, keys: (keyof Events[T])[]) => { id: string; selects: T[]; choose: EventCycleEnum },
  (value: { id: string; selects: T[]; choose: EventCycleEnum }) => void
];
export function useObserver<T extends EventKeys>(
  event: Events[T] | undefined,
  selects: T | T[]
): readonly [
  (callback: Current<T>, keys: (keyof Events[T])[]) => { id: string; selects: T[]; choose: EventCycleEnum },
  (value: { id: string; selects: T[]; choose: EventCycleEnum }) => void
];
export function useObserver<T extends EventKeys>(eventOrSelects?: Events[T] | T | T[], maybeSelects?: T | T[]) {
  const selects = (maybeSelects === undefined ? eventOrSelects : maybeSelects) as T | T[] | undefined;
  const event = (maybeSelects === undefined ? undefined : eventOrSelects) as Events[T] | undefined;

  if (selects === undefined) {
    logger.error({
      code: ResultCode.FailParams,
      message: 'select is not string or array',
      data: null
    });
    throw new Error('select is not string or array');
  }
  const [subscribe] = useSubscribe(event, selects);

  return [subscribe.mount, subscribe.cancel] as const;
}
