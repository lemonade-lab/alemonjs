import { WebSocket } from 'ws';
import { randomUUID } from 'node:crypto';
import { Result } from '../../core';
// 子客户端
export const childrenClient = new Map<string, WebSocket>();
// 平台客户端
export const platformClient = new Map<string, WebSocket>();
// 全量客户端
export const fullClient = new Map<string, WebSocket>();
export const deviceId = randomUUID();
// 连接类型
export const USER_AGENT_HEADER = 'user-agent';
//
export const USER_AGENT_HEADER_VALUE_MAP = {
  platform: 'platform',
  client: 'client',
  testone: 'testone'
};
// 设备 ID
export const DEVICE_ID_HEADER = 'x-device-id';
// 是否全量接收
export const FULL_RECEIVE_HEADER = 'x-full-receive';

type actionResolvesValue = Result[] | PromiseLike<Result[]>;

type actionResolvesValueFunc = (value: actionResolvesValue) => void;

// 行为回调
export const actionResolves = new Map<string, actionResolvesValueFunc>();
// 接口回调
export const apiResolves = new Map<string, actionResolvesValueFunc>();
// 超时器
export const actionTimeouts = new Map<string, NodeJS.Timeout>();
// 接口超时器
export const apiTimeouts = new Map<string, NodeJS.Timeout>();
// 分配绑定记录
export const childrenBind = new Map<string, string>();
// 客户端绑定计数（O(1) 负载均衡查询，替代 O(n) 全量扫描）
export const clientBindCount = new Map<string, number>();

/**
 * 绑定频道/群到客户端（同步维护计数器）
 */
export const bindChannelToClient = (channelId: string, clientId: string) => {
  const oldClientId = childrenBind.get(channelId);

  if (oldClientId && oldClientId !== clientId) {
    const oldCount = clientBindCount.get(oldClientId) ?? 0;

    if (oldCount > 1) {
      clientBindCount.set(oldClientId, oldCount - 1);
    } else {
      clientBindCount.delete(oldClientId);
    }
  }
  childrenBind.set(channelId, clientId);
  clientBindCount.set(clientId, (clientBindCount.get(clientId) ?? 0) + 1);
};

/**
 * 清理指定客户端的所有绑定记录（客户端断开时调用）
 */
export const unbindClient = (clientId: string) => {
  for (const [channelId, boundClientId] of childrenBind.entries()) {
    if (boundClientId === clientId) {
      childrenBind.delete(channelId);
    }
  }
  clientBindCount.delete(clientId);
};
// 生成唯一标识符（单调计数器 + 进程标识 — 无系统调用，~10x 快于 Date.now+Math.random）
let _idCounter = 0;
const _idPrefix = process.pid.toString(36) + Date.now().toString(36);

export const generateUniqueId = () => {
  return _idPrefix + (++_idCounter).toString(36);
};
// 超时时间
export const timeoutTime = 1000 * 60 * 3; // 3分钟
// 失败重连
export const reconnectInterval = 1000 * 6; // 6秒
// 心跳间隔
export const HEARTBEAT_INTERVAL = 1000 * 18; // 18秒
