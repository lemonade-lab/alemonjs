/**
 * @fileoverview 观察者
 * @module processor
 * @author ningmengchongshui
 */
import { Next, Events, EventCycleEnum, EventKeys } from '../types';
import { SubscribeList } from './store';

/**
 * 处理订阅
 * @param valueEvent
 * @param select
 * @param next
 * @param chioce
 */
export const expendSubscribe = <T extends EventKeys>(valueEvent: Events[T], select: T, next: Next, chioce: EventCycleEnum) => {
  const subList = new SubscribeList(chioce, select);
  /**
   * 观察者下一步
   * @returns
   */
  const nextObserver: Next = (cn?: boolean, ...cns: boolean[]) => {
    if (cn) {
      next(...cns);

      return;
    }

    const item = subList.value.popNext(); // 弹出下一个节点

    // 可能是 undefined
    if (!item) {
      // 继续 next
      nextObserver(true);

      return;
    }

    // 检查 keys
    for (const key in item.data.keys) {
      // 只要发现不符合的，就继续
      if (item.data.keys[key] !== valueEvent[key]) {
        nextObserver();

        return;
      }
    }

    const clear = () => {
      const selects = item.data.selects;
      const ID = item.data.id; // 订阅的 ID

      for (const select of selects) {
        const subList = new SubscribeList(chioce, select);
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

    // 恢复
    const restore = () => {
      const selects = item.data.selects;

      for (const select of selects) {
        const subList = new SubscribeList(chioce, select);

        subList.value.append(item.data);
      }
    };

    // 订阅是执行则销毁
    clear();

    const Continue: Next = (cn?: boolean, ...cns: boolean[]) => {
      // next() 订阅继续
      // 重新注册。
      restore();
      // true
      if (cn) {
        nextObserver(...cns);

        return;
      }
      // false
      if (typeof cn === 'boolean') {
        clear();
        nextObserver(...cns);
      }
    };

    item.data.current(valueEvent, Continue);
  };

  // 先从观察者开始
  nextObserver();
};

/**
 *
 * @param valueEvent
 * @param select
 * @param next
 */
export const expendSubscribeCreate = <T extends EventKeys>(valueEvent: Events[T], select: T, next: Next) => {
  expendSubscribe(valueEvent, select, next, 'create');
};

/**
 *
 * @param valueEvent
 * @param select
 * @param next
 */
export const expendSubscribeMount = <T extends EventKeys>(valueEvent: Events[T], select: T, next: Next) => {
  expendSubscribe(valueEvent, select, next, 'mount');
};

/**
 *
 * @param valueEvent
 * @param select
 * @param next
 */
export const expendSubscribeUnmount = <T extends EventKeys>(valueEvent: Events[T], select: T, next: Next) => {
  expendSubscribe(valueEvent, select, next, 'unmount');
};
