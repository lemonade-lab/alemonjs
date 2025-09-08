import { ResultCode } from '../core/code';
import { createResult, Result } from '../core/utils';
import { Actions } from '../typing/actions';
import { actionResolves, actionTimeouts, deviceId, generateUniqueId, timeoutTime } from './config';
import * as flattedJSON from 'flatted';
/**
 * 发送行为
 * @param data
 */
export const sendAction = (data: Actions): Promise<Result[]> => {
  const actionId = generateUniqueId();

  return new Promise(resolve => {
    // 设置唯一标识符
    data.actionId = actionId;
    // 设置设备 ID
    data.DeviceId = deviceId;
    // 沙盒模式
    if (global.sandbox) {
      if (!global.testoneClient) {
        return resolve([createResult(ResultCode.Fail, '未连接到客户端', null)]);
      }
      // 发送消息
      global.testoneClient.send(flattedJSON.stringify(data));
    } else {
      global.chatbotClient.send(flattedJSON.stringify(data));
    }
    // 设置回调函数
    actionResolves.set(actionId, resolve);
    // 超时
    const timeout = setTimeout(() => {
      // 被清理了
      if (!actionResolves.has(actionId) || !actionTimeouts.has(actionId)) {
        return;
      }
      // 删除回调
      actionResolves.delete(actionId);
      // 删除超时器
      actionTimeouts.delete(actionId);
      // 不会当错误进行处理。而是传入错误码
      resolve([createResult(ResultCode.Fail, '行为超时', null)]);
    }, timeoutTime);

    // 设置超时
    actionTimeouts.set(actionId, timeout);
  });
};
