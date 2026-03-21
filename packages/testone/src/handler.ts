import { WebSocket } from 'ws';
import * as flattedJSON from 'flatted';
import { createTestOneController } from './controller';
import type { CBPAppHandler, ParsedMessage } from './types';

/**
 * 创建 testone CBP 应用处理器
 * @param routeMessageToDevice 路由消息到指定设备的函数
 * @param handleEvent 处理事件广播的函数
 */
export const createHandler = (
  routeMessageToDevice: (DeviceId: string, message: string) => void,
  handleEvent: (message: string, ID: string) => void
): CBPAppHandler => {
  let testoneWs: WebSocket | null = null;
  let controller: ReturnType<typeof createTestOneController> | null = null;

  return {
    onClientMessage: (message: string) => {
      if (testoneWs && testoneWs.readyState === WebSocket.OPEN) {
        testoneWs.send(message.toString());
      }
    },

    onConnection: (ws: WebSocket) => {
      if (testoneWs) {
        testoneWs = null;
      }

      testoneWs = ws;
      controller = createTestOneController(ws, null);

      ws.on('message', (message: string) => {
        try {
          const parsedMessage: ParsedMessage = flattedJSON.parse(message.toString());

          if (parsedMessage.apiId) {
            const DeviceId = parsedMessage.DeviceId;

            routeMessageToDevice(DeviceId, message);
          } else if (parsedMessage?.actionId) {
            const DeviceId = parsedMessage.DeviceId;

            routeMessageToDevice(DeviceId, message);
          } else if (parsedMessage?.name) {
            const ID = parsedMessage.ChannelId || parsedMessage.GuildId || parsedMessage.DeviceId;

            handleEvent(message, ID);
          } else {
            controller.onMessage(parsedMessage);
          }
        } catch (error) {
          console.error('测试端解析平台消息失败', error);
        }
      });

      ws.on('close', () => {
        controller?.close();
        testoneWs = null;
        controller = null;
      });

      ws.on('error', err => {
        controller?.error(err);
        testoneWs = null;
        controller = null;
      });
    },

    cleanup: () => {
      testoneWs = null;
      controller = null;
    }
  };
};
