import { getConfigValue } from '../core/config';
import {
  processor_repeated_clear_size,
  processor_repeated_clear_time_max,
  processor_repeated_clear_time_min,
  processor_repeated_event_time,
  processor_repeated_user_time
} from '../core/variable';
import { EventKeys, Events } from '../types';
import { expendCycle } from './event-processor-cycle';
import { ProcessorEventAutoClearMap, ProcessorEventUserAudoClearMap } from './store';
import { createHash } from '../core/utils';

/**
 * 过滤掉重复消息
 * @param param0
 * @param MessageId
 * @returns
 */
const filter = ({ Now, store, INTERVAL }, MessageId: string) => {
  if (store.has(MessageId)) {
    const time = store.get(MessageId);

    if (Now - time < INTERVAL) {
      // 1s内重复消息
      store.set(MessageId, Date.now());

      return true;
    }
  }
  store.set(MessageId, Date.now());
};

/**
 * 清理旧消息
 */
const cleanupStore = ({ Now, store, INTERVAL }) => {
  for (const [ID, timestamp] of store.entries()) {
    // 超过时间间隔
    if (Now - timestamp > INTERVAL) {
      // 删除
      store.delete(ID);
    }
  }
};

/**
 * 清理所有消息
 */
const cleanupStoreAll = () => {
  const Now = Date.now();
  const value = getConfigValue();
  const EVENT_INTERVAL = value?.processor?.repeated_event_time ?? processor_repeated_event_time;
  const USER_INTERVAL = value?.processor?.repeated_user_time ?? processor_repeated_user_time;

  cleanupStore({ Now, INTERVAL: EVENT_INTERVAL, store: ProcessorEventAutoClearMap });
  cleanupStore({ Now, INTERVAL: USER_INTERVAL, store: ProcessorEventUserAudoClearMap });
};

// 清理消息
const callback = () => {
  cleanupStoreAll();
  // 下一次清理的时间，应该随着长度的增加而减少
  const length = ProcessorEventAutoClearMap.size + ProcessorEventUserAudoClearMap.size;
  // 长度控制在37个以内
  const time = length > processor_repeated_clear_size ? processor_repeated_clear_time_min : processor_repeated_clear_time_max;

  setTimeout(callback, time);
};

setTimeout(callback, processor_repeated_clear_time_min);

/**
 * 消息处理器
 * @param name
 * @param event
 * @param data
 * @returns
 */
export const onProcessor = <T extends EventKeys>(name: T, event: Events[T], data?: any) => {
  const Now = Date.now();
  const value = getConfigValue();
  const EVENT_INTERVAL = value?.processor?.repeated_event_time ?? processor_repeated_event_time;
  const USER_INTERVAL = value?.processor?.repeated_user_time ?? processor_repeated_user_time;

  if (event['MessageId']) {
    // 消息过长，要减少消息的长度
    const MessageId = createHash(event['MessageId']);

    // 重复消息
    if (filter({ Now, INTERVAL: EVENT_INTERVAL, store: ProcessorEventAutoClearMap }, MessageId)) {
      return;
    }
  }
  if (event['UserId']) {
    // 编号过长，要减少编号的长度
    const UserId = createHash(event['UserId']);

    // 频繁操作
    if (filter({ Now, INTERVAL: USER_INTERVAL, store: ProcessorEventUserAudoClearMap }, UserId)) {
      return;
    }
  }
  if (data) {
    // 当访问value的时候获取原始的data
    Object.defineProperty(event, 'value', {
      get() {
        return data;
      }
    });
  }
  event['name'] = name;
  expendCycle(event, name);
};

/**
 * 消息处理器
 * @param event
 * @param name
 * @deprecated 该方法已被弃用，请使用 onProcessor() 替代。
 * @returns
 */
export const OnProcessor = <T extends EventKeys>(event: Events[T], name: T) => {
  onProcessor(name, event);
};
