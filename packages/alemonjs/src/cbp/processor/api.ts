import { ResultCode } from '../../core/variable';
import { createResult, Result } from '../../core/utils';
import { apiTimeouts, apiResolves, deviceId, generateUniqueId, timeoutTime } from './config';
import type { Apis } from '../../types';
import * as flattedJSON from 'flatted';
import { getDirectSend } from './transport';

/**
 * 设置超时和回调（公用）
 */
const setupApiResolve = (apiId: string, resolve: (value: Result[] | PromiseLike<Result[]>) => void) => {
  apiResolves.set(apiId, resolve);
  const timeout = setTimeout(() => {
    if (!apiResolves.has(apiId) || !apiTimeouts.has(apiId)) {
      return;
    }
    apiResolves.delete(apiId);
    apiTimeouts.delete(apiId);
    resolve([createResult(ResultCode.Fail, '接口超时', null)]);
  }, timeoutTime);

  apiTimeouts.set(apiId, timeout);
};

/**
 * 发送接口请求
 * 优先级：直连通道 > fork IPC > WebSocket
 * @param data
 */
export const sendAPI = (data: Apis): Promise<Result[]> => {
  const ApiId = generateUniqueId();

  return new Promise(resolve => {
    data.apiId = ApiId;
    data.DeviceId = deviceId;

    // 最优：直连通道（UDS V8 序列化，零桥接）
    const directSend = getDirectSend();

    if (directSend) {
      directSend(data);
      setupApiResolve(ApiId, resolve);

      return;
    }

    // 次选：fork IPC（经主进程桥接）
    if (process.env.__ALEMON_IPC === '1' && typeof process.send === 'function') {
      process.send({ type: 'ipc:data', data });
      setupApiResolve(ApiId, resolve);

      return;
    }

    // WebSocket 模式（原有逻辑）
    if (!global.chatbotClient?.send) {
      resolve([createResult(ResultCode.Fail, 'Chatbot client is not available', null)]);

      return;
    }
    // 发送消息
    global.chatbotClient?.send(flattedJSON.stringify(data));
    // 设置回调和超时
    setupApiResolve(ApiId, resolve);
  });
};
