import { getConfigValue } from '../core/config';
import {
  processorPepeatedClearSize,
  processorRepeatedClearTimeMax,
  processorRepeatedClearTimeMin,
  processorRepeatedEventTime,
  processorRepeatedUserTime
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
  const EVENT_INTERVAL = value?.processor?.repeated_event_time ?? processorRepeatedEventTime;
  const USER_INTERVAL = value?.processor?.repeated_user_time ?? processorRepeatedUserTime;

  cleanupStore({ Now, INTERVAL: EVENT_INTERVAL, store: ProcessorEventAutoClearMap });
  cleanupStore({ Now, INTERVAL: USER_INTERVAL, store: ProcessorEventUserAudoClearMap });
};

// 清理消息
const callback = () => {
  cleanupStoreAll();
  // 下一次清理的时间，应该随着长度的增加而减少
  const length = ProcessorEventAutoClearMap.size + ProcessorEventUserAudoClearMap.size;
  // 长度控制在37个以内
  const time = length > processorPepeatedClearSize ? processorRepeatedClearTimeMin : processorRepeatedClearTimeMax;

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
    const reg = new RegExp(disabledTextRegular);

    if (reg.test(event['MessageText'])) {
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
    const reg = new RegExp(redirectRegular);

    if (reg.test(event['MessageText'])) {
      event['MessageText'] = event['MessageText'].replace(reg, redirectTarget);
    }
  }

  const mappingText = value?.mapping_text ?? [];

  // 检查文本映射规则
  for (const mapping of mappingText) {
    const { regular, target } = mapping ?? {};

    if (!regular) {
      continue;
    }
    const reg = new RegExp(regular);

    if (reg.test(event['MessageText'])) {
      event['MessageText'] = event['MessageText'].replace(reg, target);
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
    // 消息过长，要减少消息的长度
    const MessageId = createHash(event['MessageId']);

    // 重复消息
    if (filter({ Now, INTERVAL: EVENT_INTERVAL, store: ProcessorEventAutoClearMap }, MessageId)) {
      return;
    }
  }

  const USER_INTERVAL = value?.processor?.repeated_user_time ?? processorRepeatedUserTime;

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
