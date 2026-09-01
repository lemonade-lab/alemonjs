import type { ChildProcess } from 'child_process';
import { WebSocket } from 'ws';
import { fullClient } from '../cbp/processor/config.js';
import * as flattedJSON from 'flatted';
import { sanitizeForSerialization } from '../../common/index.js';
import { isNormalizedActionRequest, isNormalizedApiRequest, normalizeInboundMessage, toLegacyActionData, toLegacyApiData } from '../../common/cbp/normalize.js';
import { publishCBPFileEvent } from '../cbp/file-transport.js';

/**
 * Publish CBP traffic to the process that owns AlemonJS, when it was started
 * through child_process.fork().  This is deliberately independent from the
 * internal platform/client IPC channel: a supervising process can observe
 * login challenges without opening another WebSocket server.
 */
export const notifyParentCBPEvent = (data: unknown) => {
  if (typeof process.send !== 'function') {
    return;
  }

  try {
    process.send({ type: 'cbp.event', protocolVersion: 'v1', data });
  } catch {
    // A disconnected or shutting-down parent must not break platform traffic.
  }
};

// 子进程引用
let platformChild: ChildProcess | null = null;
let clientChild: ChildProcess | null = null;

/**
 * 设置平台子进程引用
 */
export const setPlatformChild = (child: ChildProcess | null) => {
  platformChild = child;
};

/**
 * 设置客户端子进程引用
 */
export const setClientChild = (child: ChildProcess | null) => {
  clientChild = child;
};

/**
 * 获取平台子进程引用
 */
export const getPlatformChild = () => platformChild;

/**
 * 获取客户端子进程引用
 */
export const getClientChild = () => clientChild;

/**
 * Mirror platform traffic for an external supervisor without forwarding it to
 * the module process. Direct-IPC has already delivered the event to that
 * process, so forwarding it again would duplicate application handling.
 */
export const observeFromPlatform = (data: unknown) => {
  const safeData = sanitizeForSerialization(data);
  notifyParentCBPEvent(safeData);
  publishCBPFileEvent(safeData);
};

/**
 * 将消息从平台子进程转发到客户端子进程（同时转发到 WebSocket 前端客户端）
 */
export const forwardFromPlatform = (data: any) => {
  // 清理不可序列化的值，防止跨进程传输报错
  const safeData = sanitizeForSerialization(data);

  // 外部主控进程（例如由 Go 驱动的 Node launcher）可直接监听此消息。
  observeFromPlatform(safeData);

  // 转发到客户端子进程（IPC 极速通道）
  if (clientChild?.connected) {
    clientChild.send({ type: 'ipc:data', data: safeData });
  } else if (process.env.NODE_ENV === 'development') {
    logger.debug?.({
      message: 'skip forwarding platform message before client transport ready',
      data: null
    });
  }

  // 同时转发到 WebSocket 前端客户端（供 UI 使用）— 无客户端时短路跳过
  if (fullClient.size > 0) {
    try {
      const messageStr = flattedJSON.stringify(safeData);

      fullClient.forEach((ws, id) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
        } else {
          fullClient.delete(id);
        }
      });
    } catch {
      // 序列化失败时忽略前端转发
    }
  }
};

/**
 * 将消息从客户端子进程转发到平台子进程（sandbox 模式下同时转发到 testone）
 */
export const forwardFromClient = (data: any) => {
  // 清理不可序列化的值，防止跨进程传输报错
  const safeData = sanitizeForSerialization(data);

  if (platformChild?.connected) {
    platformChild.send({ type: 'ipc:data', data: safeData });
  } else if (process.env.NODE_ENV === 'development') {
    logger.debug?.({
      message: 'skip forwarding client message before platform transport ready',
      data: null
    });
  }

  // sandbox 模式下，将客户端动作转发给 testone 前端
  if (global.__sandbox && global.testoneClient) {
    try {
      const normalized = normalizeInboundMessage(safeData);
      let outbound = safeData;

      if (isNormalizedActionRequest(normalized)) {
        outbound = toLegacyActionData(normalized);
      } else if (isNormalizedApiRequest(normalized)) {
        outbound = toLegacyApiData(normalized);
      }

      const messageStr = typeof outbound === 'string' ? outbound : flattedJSON.stringify(outbound);

      if (global.testoneClient.readyState === WebSocket.OPEN) {
        global.testoneClient.send(messageStr);
      }
    } catch {
      // 序列化失败忽略
    }
  }
};
