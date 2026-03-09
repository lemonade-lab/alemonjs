import * as flattedJSON from 'flatted';
import { ResultCode, createResult, Result } from '../../core';
import type { Actions } from '../../types';
import { actionResolves, actionTimeouts, deviceId, generateUniqueId, timeoutTime } from './config';
import { getDirectSend } from './transport';

/**
 * 设置超时和回调（公用）
 */
const setupActionResolve = (actionId: string, resolve: (value: Result[] | PromiseLike<Result[]>) => void) => {
  actionResolves.set(actionId, resolve);
  const timeout = setTimeout(() => {
    if (!actionResolves.has(actionId) || !actionTimeouts.has(actionId)) {
      return;
    }
    actionResolves.delete(actionId);
    actionTimeouts.delete(actionId);
    resolve([createResult(ResultCode.Fail, '行为超时', null)]);
  }, timeoutTime);

  actionTimeouts.set(actionId, timeout);
};

/**
 * 发送行为
 * 优先级：直连通道 > fork IPC > WebSocket
 * @param data
 */
export const sendAction = (data: Actions): Promise<Result[]> => {
  const actionId = generateUniqueId();

  return new Promise(resolve => {
    data.actionId = actionId;
    data.DeviceId = deviceId;

    // 最优：直连通道（UDS V8 序列化，零桥接）
    const directSend = getDirectSend();

    if (directSend) {
      directSend(data);
      setupActionResolve(actionId, resolve);

      return;
    }

    // 次选：fork IPC（经主进程桥接）
    if (process.env.__ALEMON_IPC === '1' && typeof process.send === 'function') {
      process.send({ type: 'ipc:data', data });
      setupActionResolve(actionId, resolve);

      return;
    }

    // WebSocket 模式（原有逻辑）
    if (!global.chatbotClient?.send) {
      resolve([createResult(ResultCode.Fail, 'Chatbot client is not available', null)]);

      return;
    }
    // 发送数据
    global.chatbotClient?.send(flattedJSON.stringify(data));
    // 设置回调和超时
    setupActionResolve(actionId, resolve);
  });
};
