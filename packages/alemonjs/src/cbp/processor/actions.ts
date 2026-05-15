import * as flattedJSON from 'flatted';
import { ResultCode, createResult, Result, sanitizeForSerialization } from '../../core';
import type { Actions } from '../../types';
import { actionRequestResolves, actionRequestTimeouts, deviceId, generateUniqueId, timeoutTime } from './config';
import { getDirectSend } from './transport';
import { createActionRequestEnvelope } from '../normalize';

/**
 * 设置超时和回调（公用）
 */
const setupActionResolve = (requestId: string, resolve: (value: Result[] | PromiseLike<Result[]>) => void) => {
  actionRequestResolves.set(requestId, resolve);
  const timeout = setTimeout(() => {
    if (!actionRequestResolves.has(requestId) || !actionRequestTimeouts.has(requestId)) {
      return;
    }
    actionRequestResolves.delete(requestId);
    actionRequestTimeouts.delete(requestId);
    resolve([createResult(ResultCode.Fail, '行为超时', null)]);
  }, timeoutTime);

  actionRequestTimeouts.set(requestId, timeout);
};

/**
 * 发送行为
 * 优先级：直连通道 > fork IPC > WebSocket
 * @param data
 */
export const sendAction = (data: Actions): Promise<Result[]> => {
  const requestId = generateUniqueId();

  return new Promise(resolve => {
    // 兼容旧平台包：legacy data 仍保留 actionId 字段
    data.actionId = requestId;
    data.DeviceId = deviceId;

    const envelope = createActionRequestEnvelope(data);
    // 清理不可序列化的值（如中间件挂载的函数），防止跨进程传输报错
    const safeData = sanitizeForSerialization(envelope);

    // 最优：直连通道（UDS V8 序列化，零桥接）
    const directSend = getDirectSend();

    if (directSend) {
      directSend(safeData);
      setupActionResolve(requestId, resolve);

      return;
    }

    // 次选：fork IPC（经主进程桥接）
    if (process.env.__ALEMON_IPC === '1' && typeof process.send === 'function') {
      process.send({ type: 'ipc:data', data: safeData });
      setupActionResolve(requestId, resolve);

      return;
    }

    // WebSocket 模式（原有逻辑）
    if (!global.chatbotClient?.send) {
      resolve([createResult(ResultCode.Fail, 'Chatbot client is not available', null)]);

      return;
    }
    // 发送数据
    global.chatbotClient?.send(flattedJSON.stringify(safeData));
    // 设置回调和超时
    setupActionResolve(requestId, resolve);
  });
};
