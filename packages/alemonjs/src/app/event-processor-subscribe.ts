/**
 * @fileoverview 观察者
 * @module processor
 * @author ningmengchongshui
 */
import { Next, Events, EventCycleEnum, EventKeys } from '../types';
import { SubscribeList } from './store';
import { SubscribeStatus } from './config';

/**
 * 处理订阅
 * @param valueEvent
 * @param select
 * @param next
 * @param choose
 */
export const expendSubscribe = <T extends EventKeys>(valueEvent: Events[T], select: T, next: Next, choose: EventCycleEnum) => {
  const subList = new SubscribeList(choose, select);
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

    // 这里代表没有 下一个节点，应该进入下一个周期
    if (!item) {
      // 下一个节点
      nextObserver(true);

      return;
    }

    const selects = item.data.selects; // 订阅的 selects
    const ID = item.data.id; // 订阅的 ID

    // 查看是否激活，如果不激活，移除并继续下一个
    if (item.data.status === SubscribeStatus.paused) {
      subList.value.removeCurrent(); // 移除当前节点
      // 下一个节点
      nextObserver();

      return;
    }

    // 检查 keys
    for (const key in item.data.keys) {
      // 只要发现不符合的，就继续
      if (item.data.keys[key] !== valueEvent[key]) {
        // 下一个节点
        nextObserver();

        return;
      }
    }

    // 恢复
    const onActive = () => {
      for (const select of selects) {
        const subList = new SubscribeList(choose, select);

        const find = () => {
          const item = subList.value.popNext(); // 弹出下一个节点

          if (!item) {
            return;
          }
          if (item.data.id !== ID) {
            find();

            return;
          }
          item.data.status = SubscribeStatus.active; // 标记为已激活
        };

        find();
      }
    };

    const onPaused = () => {
      for (const select of selects) {
        const subList = new SubscribeList(choose, select);
        const find = () => {
          const item = subList.value.popNext(); // 弹出下一个节点

          if (!item) {
            return;
          }
          if (item.data.id !== ID) {
            find();

            return;
          }
          item.data.status = SubscribeStatus.paused; // 标记为已暂停
        };

        find();
      }
    };

    // 订阅是执行则销毁
    onPaused();

    const Continue: Next = (cn?: boolean, ...cns: boolean[]) => {
      // 重新注册。
      onActive();
      // true
      if (cn) {
        // 下一个节点 next(true)
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
