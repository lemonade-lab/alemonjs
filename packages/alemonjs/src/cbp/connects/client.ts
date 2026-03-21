import * as flattedJSON from 'flatted';
import { onProcessor } from '../../app/index';
import { ResultCode } from '../../core/variable';
import { createResult } from '../../core/utils';
import { actionResolves, actionTimeouts, apiResolves, apiTimeouts, FULL_RECEIVE_HEADER } from '../processor/config';
import type { CBPClientOptions, ParsedMessage } from '../typings';
import { createWSConnector } from './base';
import { setDirectSend } from '../processor/transport';
import { createDirectServer } from '../../process/direct-channel';

/**
 * 通用消息处理（直连 / IPC / WS 共用）
 */
const handleParsedMessage = (parsedMessage: ParsedMessage) => {
  if (parsedMessage?.apiId) {
    // 接口响应
    const resolve = apiResolves.get(parsedMessage.apiId);

    if (resolve) {
      apiResolves.delete(parsedMessage.apiId);
      const timeout = apiTimeouts.get(parsedMessage.apiId);

      if (timeout) {
        apiTimeouts.delete(parsedMessage.apiId);
        clearTimeout(timeout);
      }
      if (Array.isArray(parsedMessage.payload)) {
        resolve(parsedMessage.payload);
      } else {
        resolve([createResult(ResultCode.Fail, '接口处理错误', null)]);
      }
    }
  } else if (parsedMessage?.actionId) {
    // 行为响应
    const resolve = actionResolves.get(parsedMessage.actionId);

    if (resolve) {
      actionResolves.delete(parsedMessage.actionId);
      const timeout = actionTimeouts.get(parsedMessage.actionId);

      if (timeout) {
        actionTimeouts.delete(parsedMessage.actionId);
        clearTimeout(timeout);
      }
      if (Array.isArray(parsedMessage.payload)) {
        resolve(parsedMessage.payload);
      } else {
        resolve([createResult(ResultCode.Fail, '消费处理错误', null)]);
      }
    }
  } else if (parsedMessage.name) {
    // 事件消息
    onProcessor(parsedMessage.name, parsedMessage as any, parsedMessage.value);
  }
};

/**
 * 直连模式的客户端（Unix Domain Socket 服务端，平台直连过来）
 * 完全绕过主进程，延迟 ≈ 20μs
 */
const cbpClientDirect = (sockPath: string, open: () => void) => {
  createDirectServer(sockPath, (data: any) => {
    handleParsedMessage(data as ParsedMessage);
  })
    .then(channel => {
      // 设置直连发送函数（供 sendAction / sendAPI 使用）
      setDirectSend(channel.send);
      open();

      logger.debug({
        code: ResultCode.Ok,
        message: '客户端已启用直连通道模式（Unix Domain Socket）',
        data: null
      });
    })
    .catch(err => {
      logger.error({
        code: ResultCode.Fail,
        message: '客户端直连通道建立失败，回退 fork IPC',
        data: err
      });
      // 降级到 fork IPC
      cbpClientIPC(open);
    });
};

/**
 * IPC 模式的客户端（fork IPC 通道，经主进程桥接）
 */
const cbpClientIPC = (open: () => void) => {
  // 监听来自主进程的 IPC 消息
  process.on('message', (message: any) => {
    try {
      const msg = typeof message === 'string' ? JSON.parse(message) : message;

      if (msg?.type === 'ipc:data') {
        handleParsedMessage(msg.data as ParsedMessage);
      }
    } catch (error) {
      logger.error({
        code: ResultCode.Fail,
        message: 'IPC 客户端解析消息失败',
        data: error
      });
    }
  });

  // 就绪回调
  open();

  logger.debug({
    code: ResultCode.Ok,
    message: '客户端已启用 IPC 极速通讯模式',
    data: null
  });
};

/**
 * CBP 客户端（自动检测 直连 / IPC / WebSocket 模式）
 * 优先级：直连通道 > fork IPC > WebSocket
 * @param url
 * @param options
 */
export const cbpClient = (url: string, options: CBPClientOptions = {}) => {
  const { open = () => {}, isFullReceive = true } = options;

  // 优先：直连通道（纯 IPC 模式，完全绕过主进程）
  if (process.env.__ALEMON_DIRECT_SOCK && typeof process.send === 'function') {
    cbpClientDirect(process.env.__ALEMON_DIRECT_SOCK, open);

    return;
  }

  // 次选：fork IPC（混合模式，经主进程桥接）
  if (process.env.__ALEMON_IPC === '1' && typeof process.send === 'function') {
    cbpClientIPC(open);

    return;
  }

  // 以下为 WebSocket 模式（原有逻辑）
  createWSConnector({
    url,
    role: 'client',
    globalKey: 'chatbotClient',
    extraHeaders: {
      [FULL_RECEIVE_HEADER]: isFullReceive ? '1' : '0'
    },
    onOpen: open,
    onMessage: (messageStr: string) => {
      try {
        const parsedMessage: ParsedMessage = flattedJSON.parse(messageStr);

        if (parsedMessage?.activeId) {
          // 主端主动消息
          if (parsedMessage.active === 'sync') {
            const configs = parsedMessage.payload;
            const env = configs.env || {};

            for (const key in env) {
              process.env[key] = env[key];
            }
          }
        } else {
          handleParsedMessage(parsedMessage);
        }
      } catch (error) {
        logger.error({
          code: ResultCode.Fail,
          message: '客户端解析消息失败',
          data: error
        });
      }
    }
  });
};
