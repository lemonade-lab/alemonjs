import { WebSocket } from 'ws';
import { Actions } from '../typing/actions';
import { ResultCode } from '../core/code';
import { EventsEnum } from '../typings';
import { DEVICE_ID_HEADER, deviceId, reconnectInterval, USER_AGENT_HEADER } from './config';
import { Result } from '../core/utils';
import { Apis } from '../typing/apis';
import * as flattedJSON from 'flatted';
import { useHeartbeat } from './connect';
import { ActionReplyFunc, ApiReplyFunc } from './typings';

/**
 * CBP 平台端
 * @param url
 * @param options
 * @returns
 */
export const cbpPlatform = (
  url: string,
  options = {
    open: () => {}
  }
) => {
  if (global.chatbotPlatform) {
    delete global.chatbotPlatform;
  }
  const { open = () => {} } = options;

  const [heartbeatControl] = useHeartbeat({
    ping: () => {
      global?.chatbotPlatform?.ping?.();
    },
    isConnected: () => {
      return global?.chatbotPlatform && global?.chatbotPlatform?.readyState === WebSocket.OPEN;
    },
    terminate: () => {
      try {
        global?.chatbotPlatform?.terminate?.();
      } catch (error) {
        logger.debug({
          code: ResultCode.Fail,
          message: '强制断开连接失败',
          data: error
        });
      }
    }
  });

  /**
   * 发送数据
   * @param data
   */
  const send = (data: EventsEnum) => {
    if (global.chatbotPlatform && global.chatbotPlatform.readyState === WebSocket.OPEN) {
      data.DeviceId = deviceId; // 设置设备 ID
      global.chatbotPlatform.send(flattedJSON.stringify(data));
    }
  };
  const actionReplys: ActionReplyFunc[] = [];
  const apiReplys: ApiReplyFunc[] = [];

  /**
   * 消费数据
   * @param data
   * @param payload
   */
  const replyAction = (data: Actions, payload: Result[]) => {
    if (global.chatbotPlatform && global.chatbotPlatform.readyState === WebSocket.OPEN) {
      // 透传消费。也就是对应的设备进行处理消费。
      global.chatbotPlatform.send(
        flattedJSON.stringify({
          action: data.action,
          payload: payload,
          actionId: data.actionId,
          DeviceId: data.DeviceId
        })
      );
    }
  };

  const replyApi = (data: Apis, payload: Result[]) => {
    if (global.chatbotPlatform && global.chatbotPlatform.readyState === WebSocket.OPEN) {
      // 透传消费。也就是对应的设备进行处理消费。
      global.chatbotPlatform.send(
        flattedJSON.stringify({
          action: data.action,
          apiId: data.apiId,
          DeviceId: data.DeviceId,
          payload: payload
        })
      );
    }
  };

  /**
   * 接收行为
   * @param reply
   */
  const onactions = (reply: ActionReplyFunc) => {
    actionReplys.push(reply);
  };

  /**
   * 接收接口
   */
  const onapis = (reply: ApiReplyFunc) => {
    apiReplys.push(reply);
  };

  /**
   * 启动 WebSocket 连接
   */
  const start = () => {
    global.chatbotPlatform = new WebSocket(url, {
      headers: {
        [USER_AGENT_HEADER]: 'platform',
        [DEVICE_ID_HEADER]: deviceId
      }
    });
    global.chatbotPlatform.on('open', () => {
      open();
      heartbeatControl.start(); // 启动心跳
    });

    global.chatbotPlatform.on('pong', () => {
      heartbeatControl.pong(); // 更新 pong 时间
    });

    global.chatbotPlatform.on('message', message => {
      try {
        const data = flattedJSON.parse(message.toString());

        logger.debug({
          code: ResultCode.Ok,
          message: '平台端接收消息',
          data: data
        });
        if (data.apiId) {
          for (const cb of apiReplys) {
            cb(
              data,
              // 传入一个消费函数
              val => replyApi(data, val)
            );
          }
        } else if (data.actionId) {
          for (const cb of actionReplys) {
            cb(
              data,
              // 传入一个消费函数
              val => replyAction(data, val)
            );
          }
        }
      } catch (error) {
        logger.error({
          code: ResultCode.Fail,
          message: '解析消息失败',
          data: error
        });
      }
    });
    global.chatbotPlatform.on('close', err => {
      heartbeatControl.stop(); // 停止心跳
      logger.warn({
        code: ResultCode.Fail,
        message: '平台端连接关闭，尝试重新连接...',
        data: err
      });
      delete global.chatbotPlatform;
      // 重新连接逻辑
      setTimeout(() => {
        start(); // 重新连接
      }, reconnectInterval); // 6秒后重连
    });
    global.chatbotPlatform.on('error', err => {
      logger.error({
        code: ResultCode.Fail,
        message: '平台端错误',
        data: err
      });
    });
  };

  start();

  const client = {
    send,
    onactions,
    onapis
  };

  return client;
};
