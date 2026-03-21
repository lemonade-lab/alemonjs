import { WebSocket } from 'ws';
import { ResultCode } from '../../core/variable';
import { DEVICE_ID_HEADER, deviceId, reconnectInterval, USER_AGENT_HEADER } from '../processor/config';
import { useHeartbeat } from './connect';

export type WSConnectorOptions = {
  /** WebSocket 连接 URL */
  url: string;
  /** 连接角色标识: 'client' | 'platform' */
  role: 'client' | 'platform';
  /** 连接打开时的回调 */
  onOpen?: () => void;
  /** 收到消息时的回调 */
  onMessage: (message: string) => void;
  /** 额外的请求头 */
  extraHeaders?: Record<string, string>;
  /** 全局变量 key，用于存储 WebSocket 实例 */
  globalKey: 'chatbotClient' | 'chatbotPlatform';
};

/**
 * 通用 WebSocket 连接器
 * 封装 client 和 platform 共同的连接、心跳、重连逻辑
 */
export const createWSConnector = (options: WSConnectorOptions) => {
  const { url, role, onOpen, onMessage, extraHeaders = {}, globalKey } = options;

  if (global[globalKey]) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete global[globalKey];
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
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete global[globalKey];
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
