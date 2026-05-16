import { WebSocket } from 'ws';
import { logger } from '../logger.js';
import { ResultCode } from '../variable.js';
import { DEVICE_ID_HEADER, reconnectInterval, USER_AGENT_HEADER } from './constants.js';
import { deviceId } from './runtime.js';
import { useHeartbeat } from './heartbeat.js';

export type WSConnectorOptions = {
  url: string;
  role: 'client' | 'platform';
  onOpen?: () => void;
  onMessage: (message: string) => void;
  extraHeaders?: Record<string, string>;
  globalKey: 'chatbotClient' | 'chatbotPlatform';
};

export const createWSConnector = (options: WSConnectorOptions) => {
  const { url, role, onOpen, onMessage, extraHeaders = {}, globalKey } = options;

  if (global[globalKey]) {
    Reflect.deleteProperty(global, globalKey);
  }

  const [heartbeatControl] = useHeartbeat({
    ping: () => {
      global?.[globalKey]?.ping?.();
    },
    isConnected: () => {
      return global?.[globalKey] && global?.[globalKey]?.readyState === WebSocket.OPEN;
    },
    terminate: () => {
      try {
        global?.[globalKey]?.terminate?.();
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
    global[globalKey] = new WebSocket(url, {
      headers: {
        [USER_AGENT_HEADER]: role,
        [DEVICE_ID_HEADER]: deviceId,
        ...extraHeaders
      }
    });

    global[globalKey].on('open', () => {
      onOpen?.();
      heartbeatControl.start();
    });

    global[globalKey].on('pong', () => {
      heartbeatControl.pong();
    });

    global[globalKey].on('message', (message: Buffer | string) => {
      onMessage(message.toString());
    });

    global[globalKey].on('close', (code?: number) => {
      heartbeatControl.stop();
      logger.warn({
        code: ResultCode.Fail,
        message: `${role} 连接关闭，尝试重新连接...`,
        data: code
      });
      Reflect.deleteProperty(global, globalKey);
      setTimeout(() => {
        start();
      }, reconnectInterval);
    });

    global[globalKey].on('error', (err: Error) => {
      logger.error({
        code: ResultCode.Fail,
        message: `${role} 端错误`,
        data: err
      });
    });
  };

  start();

  return { heartbeatControl };
};
