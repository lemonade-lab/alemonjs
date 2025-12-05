import { IntentsEnum } from './types.js';

/**
 * Bubble 网关相关 OpCode（参考前端文档）
 */
export enum OpCode {
  Dispatch = 0,
  Heartbeat = 1,
  // 2 is not used by bubble (identify via headers)
  Hello = 10,
  HeartbeatAck = 11,
  Subscribe = 30,
  Unsubscribe = 31
}

export interface BUBBLEOptions {
  API_URL: string;
  CDN_URL: string;
  /**
   * WebSocket 网关地址（必须在配置中提供，例如 `wss://bubble.alemonjs.com/api/bot/gateway`）
   */
  GATEWAY_URL: string;
  /**
   * Bot token
   */
  token: string;
  /**
   * 订阅事件（可选，默认值见 types.ts）
   */
  intent?: IntentsEnum[];
  /**
   * 可选的 websocket 客户端 headers 中的额外字段
   */
  clientName?: string;
}

/**
 * 简单事件映射：事件名 -> 事件负载（可用 any 扩展）
 */
export type BubbleEventMap = Record<string, any>;

export interface HelloPayload {
  heartbeat_interval: number;
}

export interface SubscribePayload {
  events: string[];
}
