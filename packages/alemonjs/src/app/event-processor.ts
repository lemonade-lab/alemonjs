import { getConfigValue } from '../core/config';
import {
  processorRepeatedClearSize,
  processorRepeatedClearTimeMax,
  processorRepeatedClearTimeMin,
  processorRepeatedEventTime,
  processorRepeatedUserTime,
  processorMaxMapSize
} from '../core/variable';
import { EventKeys, Events } from '../types';
import { expendCycle } from './event-processor-cycle';
import { ProcessorEventAutoClearMap, ProcessorEventUserAutoClearMap } from './store';
import { fastHash, getCachedRegExp } from '../core/utils';

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
  // 防止 Map 无限增长导致内存泄漏
  if (store.size >= processorMaxMapSize) {
    cleanupStore({ Now, store, INTERVAL });
    // 清理后仍然超限，删除最早的条目
    if (store.size >= processorMaxMapSize) {
      const firstKey = store.keys().next().value;

      if (firstKey !== undefined) {
        store.delete(firstKey);
      }
    }
  }
  store.set(MessageId, Date.now());
};

/**
 * 清理旧消息（带预算限制，避免大 Map 阻塞 Event Loop）
 * @returns 是否全部清理完毕
 */
const CLEANUP_BUDGET = 1000;
const cleanupStore = ({ Now, store, INTERVAL }): boolean => {
  let cleaned = 0;

  for (const [ID, timestamp] of store.entries()) {
    if (cleaned >= CLEANUP_BUDGET) {
      return false; // 预算用尽，下次继续
    }
    // 超过时间间隔
    if (Now - timestamp > INTERVAL) {
      store.delete(ID);
      cleaned++;
    }
  }

  return true;
};

/**
 * 清理所有消息
 */
const cleanupStoreAll = (): boolean => {
  const Now = Date.now();
  const value = getConfigValue();
  const EVENT_INTERVAL = value?.processor?.repeated_event_time ?? processorRepeatedEventTime;
  const USER_INTERVAL = value?.processor?.repeated_user_time ?? processorRepeatedUserTime;

  const a = cleanupStore({ Now, INTERVAL: EVENT_INTERVAL, store: ProcessorEventAutoClearMap });
  const b = cleanupStore({ Now, INTERVAL: USER_INTERVAL, store: ProcessorEventUserAutoClearMap });

  return a && b;
};

// 清理消息
const callback = () => {
  const allDone = cleanupStoreAll();

  // 如果预算用尽未清完，立即调度下一轮
  if (!allDone) {
    setImmediate(callback);

    return;
  }
  // 下一次清理的时间，应该随着长度的增加而减少
  const length = ProcessorEventAutoClearMap.size + ProcessorEventUserAutoClearMap.size;
  // 长度控制在37个以内
  const time = length > processorRepeatedClearSize ? processorRepeatedClearTimeMin : processorRepeatedClearTimeMax;

  setTimeout(callback, time);
};

setTimeout(callback, processorRepeatedClearTimeMin);

/**
 * 消息处理器
 * @param name
 * @param event
 * @param data
 * @returns
 */
export const onProcessor = <T extends EventKeys>(name: T, event: Events[T], data?: any) => {
  // 禁用规则设置
  const value = getConfigValue();
  const disabledTextRegular = value?.disabled_text_regular;

  // 检查文本禁用规则
  if (disabledTextRegular && event['MessageText']) {
    if (getCachedRegExp(disabledTextRegular).test(event['MessageText'])) {
      return;
    }
  }

  const disabledSelects = value?.disabled_selects ?? {};

  // 检查事件禁用规则
  if (disabledSelects[name]) {
    return;
  }

  const disabledUserId = value?.disabled_user_id ?? {};

  // 检查用户禁用规则
  if (event['UserId'] && disabledUserId[event['UserId']]) {
    return;
  }

  const disabledUserKey = value?.disabled_user_key ?? {};

  // 检查用户禁用规则
  if (event['UserKey'] && disabledUserKey[event['UserKey']]) {
    return;
  }

  const redirectRegular = value?.redirect_regular ?? value?.redirect_text_regular;
  const redirectTarget = value?.redirect_target ?? value?.redirect_text_target;

  // 检查文本重定向规则
  if (redirectRegular && redirectTarget && event['MessageText']) {
    const cachedReg = getCachedRegExp(redirectRegular);

    if (cachedReg.test(event['MessageText'])) {
      event['MessageText'] = event['MessageText'].replace(cachedReg, redirectTarget);
    }
  }

  const mappingText = value?.mapping_text ?? [];

  // 检查文本映射规则
  if (event['MessageText']) {
    for (const mapping of mappingText) {
      const { regular, target } = mapping ?? {};

      if (!regular) {
        continue;
      }
      const cachedReg = getCachedRegExp(regular);

      if (cachedReg.test(event['MessageText'])) {
        event['MessageText'] = event['MessageText'].replace(cachedReg, target);
      }
    }
  }

  const masterId = value?.master_id ?? {};
  const masterKey = value?.master_key ?? {};

  // 检查是否是 master
  if (event['UserId'] && masterId[event['UserId']]) {
    event['isMaster'] = true;
  } else if (event['UserKey'] && masterKey[event['UserKey']]) {
    event['isMaster'] = true;
  }

  const botId = value?.bot_id ?? {};
  const botKey = value?.bot_key ?? {};

  // 检查是否是 bot
  if (event['UserId'] && botId[event['UserId']]) {
    event['isBot'] = true;
  } else if (event['UserKey'] && botKey[event['UserKey']]) {
    event['isBot'] = true;
  }

  const Now = Date.now();
  const EVENT_INTERVAL = value?.processor?.repeated_event_time ?? processorRepeatedEventTime;

  if (event['MessageId']) {
    // FNV-1a 快速哈希 — 比 SHA-256 快 ~30-50x
    const MessageId = fastHash(event['MessageId']);

    // 重复消息
    if (filter({ Now, INTERVAL: EVENT_INTERVAL, store: ProcessorEventAutoClearMap }, MessageId)) {
      return;
    }
  }

  const USER_INTERVAL = value?.processor?.repeated_user_time ?? processorRepeatedUserTime;

  if (event['UserId']) {
    // FNV-1a 快速哈希
    const UserId = fastHash(event['UserId']);

    // 频繁操作
    if (filter({ Now, INTERVAL: USER_INTERVAL, store: ProcessorEventUserAutoClearMap }, UserId)) {
      return;
    }
  }

  if (data) {
    // 直接赋值 — 避免 defineProperty 破坏 V8 Hidden Class 优化
    event['value'] = data;
  }

  event['name'] = name;

  expendCycle(event, name, value);
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
