import * as flattedJSON from 'flatted';
import { WebSocket } from 'ws';
import { deviceId } from '../processor/config';
import { ResultCode } from '../../core/variable';
import { Result } from '../../core/utils';
import type { Actions, Apis, EventsEnum } from '../../types';
import type { ActionReplyFunc, ApiReplyFunc } from '../typings';
import { createWSConnector } from './base';
import { createDirectClient, type DirectChannel } from '../../process/direct-channel';

/**
 * 直连模式的平台端（Unix Domain Socket 直连客户端，零桥接跳转）
 * 完全绕过主进程，延迟 ≈ 20μs
 */
const cbpPlatformDirect = (sockPath: string, open: () => void) => {
  const actionReplys: ActionReplyFunc[] = [];
  const apiReplys: ApiReplyFunc[] = [];
  let channel: DirectChannel | null = null;
  const pendingQueue: any[] = [];

  /**
   * 发送事件（连接就绪前自动缓冲）
   */
  const send = (data: EventsEnum) => {
    data.DeviceId = deviceId;
    data.CreateAt = Date.now();
    if (channel) {
      channel.send(data);
    } else {
      pendingQueue.push({ ...data });
    }
  };

  /**
   * 回复行为结果
   */
  const replyAction = (data: Actions, payload: Result[]) => {
    channel?.send({
      action: data.action,
      payload: payload,
      actionId: data.actionId,
      DeviceId: data.DeviceId
    });
  };

  /**
   * 回复接口结果
   */
  const replyApi = (data: Apis, payload: Result[]) => {
    channel?.send({
      action: data.action,
      apiId: data.apiId,
      DeviceId: data.DeviceId,
      payload: payload
    });
  };

  const onactions = (reply: ActionReplyFunc) => {
    actionReplys.push(reply);
  };

  const onapis = (reply: ApiReplyFunc) => {
    apiReplys.push(reply);
  };

  // 异步建立直连（自带重试）
  createDirectClient(sockPath, (data: any) => {
    // 接收来自客户端的行为/接口请求
    if (data?.apiId) {
      for (const cb of apiReplys) {
        void cb(data, val => replyApi(data, val));
      }
    } else if (data?.actionId) {
      for (const cb of actionReplys) {
        void cb(data, val => replyAction(data, val));
      }
    }
  })
    .then(ch => {
      channel = ch;
      // 刷新缓冲队列
      for (const msg of pendingQueue) {
        channel.send(msg);
      }
      pendingQueue.length = 0;

      open();

      logger.debug({
        code: ResultCode.Ok,
        message: '平台端已启用直连通道模式（Unix Domain Socket）',
        data: null
      });
    })
    .catch(err => {
      logger.error({
        code: ResultCode.Fail,
        message: '平台端直连通道建立失败，回退 fork IPC',
        data: err
      });
      // 降级到 fork IPC 模式
      cbpPlatformIPC(open, actionReplys, apiReplys);
    });

  return { send, onactions, onapis };
};

/**
 * IPC 模式的平台端（fork IPC 通道，经主进程桥接）
 * 用于混合模式（port 已配置）或直连降级回退
 */
const cbpPlatformIPC = (open: () => void, existingActionReplys?: ActionReplyFunc[], existingApiReplys?: ApiReplyFunc[]) => {
  const actionReplys: ActionReplyFunc[] = existingActionReplys ?? [];
  const apiReplys: ApiReplyFunc[] = existingApiReplys ?? [];

  /**
   * 通过 IPC 发送事件数据
   */
  const send = (data: EventsEnum) => {
    if (typeof process.send === 'function') {
      data.DeviceId = deviceId;
      data.CreateAt = Date.now();
      process.send({ type: 'ipc:data', data });
    }
  };

  /**
   * 通过 IPC 回复行为结果
   */
  const replyAction = (data: Actions, payload: Result[]) => {
    if (typeof process.send === 'function') {
      process.send({
        type: 'ipc:data',
        data: {
          action: data.action,
          payload: payload,
          actionId: data.actionId,
          DeviceId: data.DeviceId
        }
      });
    }
  };

  /**
   * 通过 IPC 回复接口结果
   */
  const replyApi = (data: Apis, payload: Result[]) => {
    if (typeof process.send === 'function') {
      process.send({
        type: 'ipc:data',
        data: {
          action: data.action,
          apiId: data.apiId,
          DeviceId: data.DeviceId,
          payload: payload
        }
      });
    }
  };

  const onactions = (reply: ActionReplyFunc) => {
    actionReplys.push(reply);
  };

  const onapis = (reply: ApiReplyFunc) => {
    apiReplys.push(reply);
  };

  // 监听来自主进程的 IPC 消息（接收行为/接口请求）
  process.on('message', (message: any) => {
    try {
      const msg = typeof message === 'string' ? JSON.parse(message) : message;

      if (msg?.type === 'ipc:data') {
        const data = msg.data;

        if (data?.apiId) {
          for (const cb of apiReplys) {
            void cb(data, val => replyApi(data, val));
          }
        } else if (data?.actionId) {
          for (const cb of actionReplys) {
            void cb(data, val => replyAction(data, val));
          }
        }
      }
    } catch (error) {
      logger.error({
        code: ResultCode.Fail,
        message: 'IPC 平台端解析消息失败',
        data: error
      });
    }
  });

  // 就绪回调
  open();

  logger.debug({
    code: ResultCode.Ok,
    message: '平台端已启用 IPC 极速通讯模式',
    data: null
  });

  return {
    send,
    onactions,
    onapis
  };
};

/**
 * CBP 平台端（自动检测 直连 / IPC / WebSocket 模式）
 * 优先级：直连通道 > fork IPC > WebSocket
 * @param url
 * @param options
 * @returns
 */
export const cbpPlatform = (
  url?: string,
  options = {
    open: () => {}
  }
) => {
  const { open = () => {} } = options;

  // 优先：直连通道（纯 IPC 模式，完全绕过主进程）
  if (process.env.__ALEMON_DIRECT_SOCK && typeof process.send === 'function') {
    return cbpPlatformDirect(process.env.__ALEMON_DIRECT_SOCK, open);
  }

  // 次选：fork IPC（混合模式，经主进程桥接）
  if (process.env.__ALEMON_IPC === '1' && typeof process.send === 'function') {
    return cbpPlatformIPC(open);
  }

  const createCurrentURL = () => {
    if (url) {
      if (url.startsWith('ws://') || url.startsWith('wss://')) {
        return url;
      }
      // 视为端口号
      if (/^\d+$/.test(url)) {
        return `ws://localhost:${url}`;
      }
    }
    if (process.env.__ALEMON_PLATFORM_WS_URL) {
      return process.env.__ALEMON_PLATFORM_WS_URL;
    }
  };
  const currentURL = createCurrentURL() || `ws://localhost:${process.env.port || 17117}`;

  /**
   * 发送数据
   * @param data
   */
  const send = (data: EventsEnum) => {
    if (global.chatbotPlatform && global.chatbotPlatform.readyState === WebSocket.OPEN) {
      data.DeviceId = deviceId;
      data.CreateAt = Date.now();
      global.chatbotPlatform.send(flattedJSON.stringify(data));
    }
  };
  const actionReplys: ActionReplyFunc[] = [];
  const apiReplys: ApiReplyFunc[] = [];

  /**
   * 消费数据
   */
  const replyAction = (data: Actions, payload: Result[]) => {
    if (global.chatbotPlatform && global.chatbotPlatform.readyState === WebSocket.OPEN) {
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

  createWSConnector({
    url: currentURL,
    role: 'platform',
    globalKey: 'chatbotPlatform',
    onOpen: open,
    onMessage: (messageStr: string) => {
      try {
        const data = flattedJSON.parse(messageStr);

        if (data.apiId) {
          for (const cb of apiReplys) {
            void cb(data, val => replyApi(data, val));
          }
        } else if (data.actionId) {
          for (const cb of actionReplys) {
            void cb(data, val => replyAction(data, val));
          }
        }
      } catch (error) {
        logger.error({
          code: ResultCode.Fail,
          message: '解析消息失败',
          data: error
        });
      }
    }
  });

  const client = {
    send,
    onactions,
    onapis
  };

  return client;
};
