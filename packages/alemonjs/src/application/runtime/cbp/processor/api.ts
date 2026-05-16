import { ResultCode, createResult, Result, deviceId, generateUniqueId, sanitizeForSerialization, timeoutTime } from '../../../../common/index.js';
import { apiRequestTimeouts, apiRequestResolves } from './request-registry.js';
import type { Apis } from '../../../../types/index.js';
import * as flattedJSON from 'flatted';
import { getDirectSend } from './transport.js';
import { createApiRequestEnvelope } from '../../../../common/cbp/normalize.js';

/**
 * 设置超时和回调（公用）
 */
const setupApiResolve = (requestId: string, resolve: (value: Result[] | PromiseLike<Result[]>) => void) => {
  apiRequestResolves.set(requestId, resolve);
  const timeout = setTimeout(() => {
    if (!apiRequestResolves.has(requestId) || !apiRequestTimeouts.has(requestId)) {
      return;
    }
    apiRequestResolves.delete(requestId);
    apiRequestTimeouts.delete(requestId);
    resolve([createResult(ResultCode.Fail, '接口超时', null)]);
  }, timeoutTime);

  apiRequestTimeouts.set(requestId, timeout);
};

/**
 * 发送接口请求
 * 优先级：直连通道 > fork IPC > WebSocket
 * @param data
 */
export const sendAPI = (data: Apis): Promise<Result[]> => {
  const requestId = generateUniqueId();

  return new Promise(resolve => {
    // 兼容旧平台包：legacy data 仍保留 apiId 字段
    data.apiId = requestId;
    data.DeviceId = deviceId;

    const envelope = createApiRequestEnvelope(data);
    // 清理不可序列化的值（如中间件挂载的函数），防止跨进程传输报错
    const safeData = sanitizeForSerialization(envelope);

    // 最优：直连通道（UDS V8 序列化，零桥接）
    const directSend = getDirectSend();

    if (directSend) {
      directSend(safeData);
      setupApiResolve(requestId, resolve);

      return;
    }

    // 次选：fork IPC（经主进程桥接）
    if (process.env.__ALEMON_IPC === '1' && typeof process.send === 'function') {
      process.send({ type: 'ipc:data', data: safeData });
      setupApiResolve(requestId, resolve);

      return;
    }

    // WebSocket 模式（原有逻辑）
    if (!global.chatbotClient?.send) {
      resolve([createResult(ResultCode.Fail, 'Chatbot client is not available', null)]);

      return;
    }
    // 发送消息
    global.chatbotClient?.send(flattedJSON.stringify(safeData));
    // 设置回调和超时
    setupApiResolve(requestId, resolve);
  });
};
