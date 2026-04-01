import { AsyncLocalStorage } from 'node:async_hooks';
import { EventKeys, Events } from '../types';

type EventContext<T extends EventKeys = EventKeys> = {
  event: Events[T];
  next: (...args: boolean[]) => void;
};

const eventStore = new AsyncLocalStorage<EventContext>();

/**
 * 在当前异步调用链中绑定事件上下文。
 */
export const withEventContext = <T extends EventKeys, R>(event: Events[T], next: (...args: boolean[]) => void, runner: () => R): R => {
  return eventStore.run({ event, next }, runner);
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
