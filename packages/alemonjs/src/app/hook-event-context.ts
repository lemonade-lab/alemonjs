import { AsyncLocalStorage } from 'node:async_hooks';
import { EventKeys, Events } from '../types';

const eventStore = new AsyncLocalStorage<Events[EventKeys]>();

/**
 * 在当前异步调用链中绑定事件上下文。
 */
export const withEventContext = <T extends EventKeys, R>(event: Events[T], runner: () => R): R => {
  return eventStore.run(event, runner);
};

/**
 * 读取当前异步调用链中的事件上下文。
 */
export const getCurrentEvent = <T extends EventKeys>(): Events[T] | undefined => {
  return eventStore.getStore() as Events[T] | undefined;
};
