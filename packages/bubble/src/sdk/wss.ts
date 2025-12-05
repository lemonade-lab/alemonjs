import WebSocket from 'ws';
import { BubbleAPI } from './api.js';
import { getBubbleConfig } from '../config.js';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { type IntentsEnum, type BubbleEventMap, AIntentsEventsEnum } from './types.js';
import dayjs from 'dayjs';
import { OpCode, type HelloPayload, type SubscribePayload } from './wss.types.js';

/**
 * @description Bubble WebSocket 客户端（符合前端文档协议）
 */
export class BubbleClient extends BubbleAPI {
  #heartbeat_interval = 0;

  #session_id = '';

  #gateway_url = '';

  #timeout_id: any = null;

  #seq: number | null = null;

  #ws: WebSocket | null = null;

  // 重连次数
  #count = 0;

  #events: Partial<Record<keyof BubbleEventMap, (payload: any) => any>> = {};

  constructor() {
    super();

    return this;
  }

  #getReConnectTime() {
    const time = this.#count > 3 ? 1000 * 6 : 1000 * 1;
    const curTime = this.#count > 6 ? 1000 * this.#count * 2 : time;

    logger?.info?.(`[ws-bubble] 等待 ${dayjs(curTime).format('mm:ss')} 后重新连接`);

    return curTime;
  }

  /**
   * 注册事件处理程序
   * @param event 事件类型
   * @param handler 事件处理函数
   */
  on<K extends keyof BubbleEventMap>(event: K, handler: (payload: BubbleEventMap[K]) => void | Promise<void>): this;
  on(event: string, handler: (payload: any) => void | Promise<void>): this;
  on(event: string, handler: (payload: any) => void | Promise<void>): this {
    this.#events[event as keyof BubbleEventMap] = handler;

    return this;
  }

  /**
   * 发送订阅请求
   * @param events 要订阅的事件类型列表
   */
  sendSubscribe(events: IntentsEnum[]): void {
    if (!this.#ws) {
      return;
    }
    const payload: SubscribePayload = { events };

    this.#ws.send(JSON.stringify({ op: OpCode.Subscribe, d: payload }));
  }

  /**
   * 取消订阅事件类型
   * @param events 要取消订阅的事件类型列表
   */
  sendUnsubscribe(events: IntentsEnum[]): void {
    if (!this.#ws) {
      return;
    }
    const payload: SubscribePayload = { events };

    this.#ws.send(JSON.stringify({ op: OpCode.Unsubscribe, d: payload }));
  }

  connect() {
    this.#count++;

    const value = getBubbleConfig();
    const url = value.URL;

    // 清除序列号
    this.#seq = null;
    // 清除心跳
    clearTimeout(this.#timeout_id);

    try {
      if (!url) {
        logger?.error?.('[ws-bubble] 未在配置中找到 WebSocket `URL`，请在配置中设置 `URL` 字段以连接网关');
        const curTime = this.#getReConnectTime();

        setTimeout(() => {
          void this.connect();
        }, curTime);

        return;
      }

      const callHeartbeat = () => {
        if (!this.#ws) {
          return;
        }
        this.#ws.send(JSON.stringify({ op: OpCode.Heartbeat, d: this.#seq }));
        clearTimeout(this.#timeout_id);
        this.#timeout_id = setTimeout(callHeartbeat, this.#heartbeat_interval);
      };

      const handlers: Record<number, (msg: any) => void> = {
        [OpCode.Dispatch]: ({ d, t, s }: { d: any; t: string; s?: number }) => {
          if (s !== null) {
            this.#seq = s;
          }

          // BOT_READY
          if (t === 'BOT_READY') {
            if (d?.resume_gateway_url) {
              this.#gateway_url = d.resume_gateway_url;
              logger?.info?.('[ws-bubble] gateway_url', this.#gateway_url);
            }
            if (d?.session_id) {
              this.#session_id = d.session_id;
              logger?.info?.('[ws-bubble] session_id', this.#session_id);
            }

            // 在 BOT_READY 后自动向服务端订阅事件
            const events = value.intent || AIntentsEventsEnum;

            this.sendSubscribe(events);
          }

          // 派发到用户注册的事件处理
          if (t && this.#events[t]) {
            try {
              this.#events[t](d);
            } catch (err) {
              logger?.error?.('[ws-bubble] 事件处理错误', err);
            }
          }
        },
        [OpCode.Hello]: ({ d }: { d: HelloPayload }) => {
          this.#heartbeat_interval = d.heartbeat_interval || 30000;
          callHeartbeat();
          // 对于 bubble 网关，不需要发送 identify payload（通过 headers 验证）
        },
        [OpCode.HeartbeatAck]: () => {
          logger?.debug?.('[ws-bubble] 心跳确认');
        }
      };

      const ClientOptions = value.websocket_options || {};
      // add headers for auth
      const token = value.token;
      const clientName = value.clientName || 'alemonjs-bot';

      ClientOptions.headers = Object.assign({}, ClientOptions.headers || {}, {
        Authorization: `Bearer ${token}`,
        'X-Client': clientName
      });

      if (value.websocket_proxy) {
        ClientOptions.agent = new HttpsProxyAgent(value.websocket_proxy);
      }

      this.#ws = new WebSocket(url, ClientOptions);

      this.#ws.on('open', () => {
        logger?.info?.('[ws-bubble] 打开连接');
        this.#count = 0;
      });

      this.#ws.on('message', data => {
        let message: any;

        try {
          message = JSON.parse(data.toString());
        } catch (err) {
          logger?.error?.('[ws-bubble] 解析消息错误', err);

          return;
        }
        const op = message.op;

        if (handlers[op]) {
          handlers[op](message);
        }
      });

      this.#ws.on('close', err => {
        logger?.info?.('[ws-bubble] 连接关闭', err);
        const curTime = this.#getReConnectTime();

        setTimeout(() => {
          void this.connect();
        }, curTime);
      });

      this.#ws.on('error', err => {
        logger?.error?.('[ws-bubble] 出错', err?.message || err);
      });
    } catch (err) {
      logger?.error?.('[ws-bubble] 内部错误', err);
    }
  }
}
