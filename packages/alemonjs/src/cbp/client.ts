import { WebSocket } from 'ws';
import { onProcessor } from '../app/event-processor';
import { ResultCode } from '../core/variable';
import {
  actionResolves,
  actionTimeouts,
  apiResolves,
  apiTimeouts,
  DEVICE_ID_HEADER,
  deviceId,
  FULL_RECEIVE_HEADER,
  reconnectInterval,
  USER_AGENT_HEADER
} from './config';
import { createResult } from '../core/utils';
import * as flattedJSON from 'flatted';
import { CBPClientOptions, ParsedMessage } from './typings';
import { useHeartbeat } from './connect';

/**
 * CBP 客户端
 * @param url
 * @param onopen
 */
export const cbpClient = (url: string, options: CBPClientOptions = {}) => {
  /**
   * 纯 cbpClient 连接，会没有 一些 全局变量。
   * 需要在此处进行判断并设置
   */
  if (global.chatbotClient) {
    delete global.chatbotClient;
  }
  const { open = () => {}, isFullReceive = true } = options;

  const [heartbeatControl] = useHeartbeat({
    ping: () => {
      global?.chatbotClient?.ping?.();
    },
    isConnected: () => {
      return global?.chatbotClient && global?.chatbotClient?.readyState === WebSocket.OPEN;
    },
    terminate: () => {
      try {
        // 强制断开连接
        global?.chatbotClient?.terminate?.();
      } catch (error) {
        logger.debug({
          code: ResultCode.Fail,
          message: '强制断开连接失败',
          data: error
        });
      }
    }
  });

  const start = () => {
    global.chatbotClient = new WebSocket(url, {
      headers: {
        [USER_AGENT_HEADER]: 'client',
        [DEVICE_ID_HEADER]: deviceId,
        [FULL_RECEIVE_HEADER]: isFullReceive ? '1' : '0'
      }
    });
    global.chatbotClient.on('open', () => {
      open();
      heartbeatControl.start(); // 启动心跳
    });

    global.chatbotClient.on('pong', () => {
      heartbeatControl.pong(); // 更新 pong 时间
    });

    // 客户端接收，被标准化的平台消息
    global.chatbotClient.on('message', message => {
      try {
        // 解析消息
        const parsedMessage: ParsedMessage = flattedJSON.parse(message.toString());

        logger.debug({
          code: ResultCode.Ok,
          message: '客户端接收到消息',
          data: parsedMessage
        });
        if (parsedMessage?.activeId) {
          // 主端端主动消息。
          if (parsedMessage.active === 'sync') {
            const configs = parsedMessage.payload;
            // env 同步
            const env = configs.env || {};

            for (const key in env) {
              process.env[key] = env[key];
            }
          }
        } else if (parsedMessage?.apiId) {
          // 如果有 apiId，说明是一个接口请求。要进行处理
          const resolve = apiResolves.get(parsedMessage.apiId);

          if (resolve) {
            apiResolves.delete(parsedMessage.apiId);
            // 清除超时器
            const timeout = apiTimeouts.get(parsedMessage.apiId);

            if (timeout) {
              apiTimeouts.delete(parsedMessage.apiId);
              clearTimeout(timeout);
            }
            // 调用回调函数
            if (Array.isArray(parsedMessage.payload)) {
              resolve(parsedMessage.payload);
            } else {
              // 错误处理
              resolve([createResult(ResultCode.Fail, '接口处理错误', null)]);
            }
          }
        } else if (parsedMessage?.actionId) {
          // 如果有 actionId
          const resolve = actionResolves.get(parsedMessage.actionId);

          if (resolve) {
            actionResolves.delete(parsedMessage.actionId);
            // 清除超时器
            const timeout = actionTimeouts.get(parsedMessage.actionId);

            if (timeout) {
              actionTimeouts.delete(parsedMessage.actionId);
              clearTimeout(timeout);
            }
            // 调用回调函数
            if (Array.isArray(parsedMessage.payload)) {
              resolve(parsedMessage.payload);
            } else {
              // 错误处理
              resolve([createResult(ResultCode.Fail, '消费处理错误', null)]);
            }
          }
        } else if (parsedMessage.name) {
          // 如果有 name，说明是一个事件请求。要进行处理
          onProcessor(parsedMessage.name, parsedMessage as any, parsedMessage.value);
        }
      } catch (error) {
        logger.error({
          code: ResultCode.Fail,
          message: '客户端解析消息失败',
          data: error
        });
      }
    });
    global.chatbotClient.on('close', () => {
      heartbeatControl.stop(); // 停止心跳
      logger.warn({
        code: ResultCode.Fail,
        message: '连接关闭，尝试重新连接...',
        data: null
      });
      delete global.chatbotClient;
      // 重新连接逻辑
      setTimeout(() => {
        start(); // 重新连接
      }, reconnectInterval); // 6秒后重连
    });
    global.chatbotClient.on('error', err => {
      logger.error({
        code: ResultCode.Fail,
        message: '客户端错误',
        data: err
      });
    });
  };

  start();
};
