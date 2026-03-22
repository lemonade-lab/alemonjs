import type { ChildProcess } from 'child_process';
import { WebSocket } from 'ws';
import { fullClient } from '../cbp/processor/config';
import * as flattedJSON from 'flatted';

// CBP 应用广播回调（由 cbp/server/main.ts 注册）
let cbpAppsBroadcast: ((message: string) => void) | null = null;

/**
 * 注册 CBP 应用广播函数（sandbox 模式下客户端消息 → testone 等应用）
 */
export const setCBPAppsBroadcast = (fn: ((message: string) => void) | null) => {
  cbpAppsBroadcast = fn;
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
 * 将消息从平台子进程转发到客户端子进程（同时转发到 WebSocket 前端客户端）
 */
export const forwardFromPlatform = (data: any) => {
  // 转发到客户端子进程（IPC 极速通道）
  if (clientChild?.connected) {
    clientChild.send({ type: 'ipc:data', data });
  }

  // 同时转发到 WebSocket 前端客户端（供 UI 使用）— 无客户端时短路跳过
  if (fullClient.size > 0) {
    try {
      const messageStr = flattedJSON.stringify(data);

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
 * 将消息从客户端子进程转发到平台子进程
 */
export const forwardFromClient = (data: any) => {
  if (platformChild?.connected) {
    platformChild.send({ type: 'ipc:data', data });
  }

  // sandbox 模式：平台不存在时，广播到 CBP 应用（如 testone）
  if (cbpAppsBroadcast && global.__sandbox) {
    try {
      cbpAppsBroadcast(flattedJSON.stringify(data));
    } catch {
      // 序列化失败忽略
    }
  }
};
