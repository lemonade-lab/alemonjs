import { EventCycleEnum, Current, Events, EventKeys } from '../types';
import { ResultCode } from '../core/variable';
import { SubscribeList } from './store';

type KeyMap = {
  [key: string]: string | number | boolean;
};

/**
 * 订阅事件
 * @param event
 * @param select
 * @returns
 */
export const useSubscribe = <T extends EventKeys>(event: Events[T], selects: T | T[]) => {
  // 检查参数
  if (typeof event !== 'object') {
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

    // 创建 订阅 列表
    for (const select of curSelects) {
      const subList = new SubscribeList(choose, select);

      // 没有选择
      if (keys.length === 0) {
        return;
      }
      // 只能选择基础数据类型的key
      const values: KeyMap = {};

      for (const key of keys) {
        if (typeof key === 'string' && (typeof event[key] === 'string' || typeof event[key] === 'number' || typeof event[key] === 'boolean')) {
          values[key] = event[key];
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
      const remove = () => {
        const item = subList.value.popNext(); // 弹出下一个节点

        if (!item || item.data.id !== ID) {
          remove();

          return;
        }
        subList.value.removeCurrent(); // 移除当前节点
      };

      remove();
    }
  };

  const subscribe = {
    create,
    mount: mountBefore,
    unmount,
    cancel
  };

  return [subscribe] as const;
};

/**
 * 使用观察者模式订阅事件
 * @param event
 * @param selects
 * @returns
 * 废弃，请使用 useSubscribe
 * @deprecated
 */
export const useObserver = <T extends EventKeys>(event: Events[T], selects: T | T[]) => {
  const [subscribe] = useSubscribe(event, selects);

  return [subscribe.mount, subscribe.cancel] as const;
};
