import type { ChildProcess } from 'child_process';
import { WebSocket } from 'ws';
import { fullClient } from '../cbp/processor/config';
import * as flattedJSON from 'flatted';
import { sanitizeForSerialization } from '../core';

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
 * 将消息从平台子进程转发到客户端子进程（同时转发到 WebSocket 前端客户端）
 */
export const forwardFromPlatform = (data: any) => {
  // 清理不可序列化的值，防止跨进程传输报错
  const safeData = sanitizeForSerialization(data);

  // 转发到客户端子进程（IPC 极速通道）
  if (clientChild?.connected) {
    clientChild.send({ type: 'ipc:data', data: safeData });
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
  }

  // sandbox 模式下，将客户端动作转发给 testone 前端
  if (global.__sandbox && global.testoneClient) {
    try {
      const messageStr = typeof safeData === 'string' ? safeData : flattedJSON.stringify(safeData);

      if (global.testoneClient.readyState === WebSocket.OPEN) {
        global.testoneClient.send(messageStr);
      }
    } catch {
      // 序列化失败忽略
    }
  }
};
