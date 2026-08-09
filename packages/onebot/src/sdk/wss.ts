import WebSocket, { WebSocketServer } from 'ws';
import { consume, OneBotAPI } from './api';
import { rejectPendingActions } from './config';
import { V11Driver, V12Driver, type OneBotDriver, type OneBotProtocol } from './driver';
import type { OneBotEventMap, OneBotV12Self } from './typing';

type ClientOptions = {
  url: string;
  access_token: string;
  reverse_enable: boolean;
  reverse_port: number;
  version?: OneBotProtocol;
  default_bot?: string;
};

const probeTimeout = 8_000;
const heartbeatTimeout = 65_000;

/** A shared WebSocket transport with isolated v11/v12 protocol drivers. */
export class OneBotClient extends OneBotAPI {
  #options: ClientOptions;
  #events: { [K in keyof OneBotEventMap]?: (event: any) => any } = {};
  #driver: OneBotDriver;
  #fallbackLocked = false;
  #reconnectAttempts = 0;
  #reconnectTimer: NodeJS.Timeout | null = null;
  #probeTimer: NodeJS.Timeout | null = null;
  #heartbeatTimer: NodeJS.Timeout | null = null;
  #reverseServer: WebSocketServer | null = null;
  #bots = new Map<string, { id: string; platform: string; userId: string; online: boolean }>();

  constructor(options: ClientOptions) {
    super();
    this.#options = { ...options, version: options.version ?? 11 };
    this.#driver = this.#options.version === 12 ? new V12Driver() : new V11Driver();
    this.updateConnectionStatus({
      requestedVersion: this.#options.version,
      activeVersion: this.#options.version,
      state: 'idle',
      transport: this.#options.reverse_enable ? 'reverse_ws' : 'forward_ws'
    });
  }

  get isV12() {
    return this.#driver.version === 12;
  }

  /** Sends a OneBot 12 standard action and routes it to an explicit or selected bot. */
  sendV12Action(action: string, params: Record<string, any> = {}, self?: OneBotV12Self) {
    if (!this.isV12) {
      return Promise.reject(new Error('[OneBot] 当前连接不是 OneBot 12'));
    }
    const target = this.#resolveBot(self);
    return this.send({ action, params, self: { platform: target.platform, user_id: target.userId } });
  }

  getSupportedActions(self?: OneBotV12Self) {
    return this.sendV12Action('get_supported_actions', {}, self);
  }
  getV12Status(self?: OneBotV12Self) {
    return this.sendV12Action('get_status', {}, self);
  }
  getV12Version(self?: OneBotV12Self) {
    return this.sendV12Action('get_version', {}, self);
  }
  getSelfInfo(self?: OneBotV12Self) {
    return this.sendV12Action('get_self_info', {}, self);
  }
  getUserInfo(user_id: string, self?: OneBotV12Self) {
    return this.sendV12Action('get_user_info', { user_id: String(user_id) }, self);
  }
  getV12FriendList(self?: OneBotV12Self) {
    return this.sendV12Action('get_friend_list', {}, self);
  }
  getV12GroupInfo(group_id: string, self?: OneBotV12Self) {
    return this.sendV12Action('get_group_info', { group_id: String(group_id) }, self);
  }
  getV12GroupList(self?: OneBotV12Self) {
    return this.sendV12Action('get_group_list', {}, self);
  }
  getV12GroupMemberInfo(group_id: string, user_id: string, self?: OneBotV12Self) {
    return this.sendV12Action('get_group_member_info', { group_id: String(group_id), user_id: String(user_id) }, self);
  }
  getV12GroupMemberList(group_id: string, self?: OneBotV12Self) {
    return this.sendV12Action('get_group_member_list', { group_id: String(group_id) }, self);
  }
  getV12Message(message_id: string, self?: OneBotV12Self) {
    return this.sendV12Action('get_message', { message_id: String(message_id) }, self);
  }
  deleteV12Message(message_id: string, self?: OneBotV12Self) {
    return this.sendV12Action('delete_message', { message_id: String(message_id) }, self);
  }

  #resolveBot(self?: OneBotV12Self) {
    if (self) return { platform: String(self.platform), userId: String(self.user_id) };
    if (this.#options.default_bot) {
      const [platform, userId] = this.#options.default_bot.split(':', 2);
      return { platform, userId };
    }
    const online = [...this.#bots.values()].filter(bot => bot.online);
    if (online.length === 1) return online[0];
    if (online.length === 0) throw new Error('[OneBot] 没有在线的 v12 Bot，无法发送动作');
    throw new Error('[OneBot] 已连接多个 v12 Bot；请配置 onebot.default_bot（<platform>:<user_id>）或指定事件所属 Bot');
  }

  #emit(name: string, event: any) {
    this.#events[name as keyof OneBotEventMap]?.(event);
  }

  on<T extends keyof OneBotEventMap>(key: T, val: (event: OneBotEventMap[T]) => any) {
    this.#events[key] = val;
    return this;
  }

  #getReconnectDelay() {
    return Math.min(1_000 * 2 ** Math.min(this.#reconnectAttempts, 5), 30_000);
  }

  #clearProbe() {
    if (this.#probeTimer) clearTimeout(this.#probeTimer);
    this.#probeTimer = null;
  }

  #clearHeartbeat() {
    if (this.#heartbeatTimer) clearTimeout(this.#heartbeatTimer);
    this.#heartbeatTimer = null;
  }

  #resetHeartbeat(ws: WebSocket) {
    this.#clearHeartbeat();
    this.#heartbeatTimer = setTimeout(() => {
      if (this.__ws !== ws) return;
      logger.warn('[OneBot] 心跳或状态更新超时，连接已标记离线');
      this.updateConnectionStatus({ state: 'offline' });
      rejectPendingActions(new Error('[OneBot] 心跳超时，待处理动作已取消'));
      if (this.#options.reverse_enable) {
        ws.close(1011, 'heartbeat timeout');
      } else {
        ws.terminate();
      }
    }, heartbeatTimeout);
  }

  #setBotStatus(self: OneBotV12Self | undefined, online: boolean) {
    if (!self) return;
    const platform = String(self.platform);
    const userId = String(self.user_id);
    const id = `${platform}:${userId}`;
    this.#bots.set(id, { id, platform, userId, online });
    this.updateConnectionStatus({ bots: [...this.#bots.values()] });
  }

  #markReady(ws: WebSocket, event: any) {
    this.#clearProbe();
    this.#reconnectAttempts = 0;
    if (this.isV12) this.#setBotStatus(event.self, true);
    this.updateConnectionStatus({ activeVersion: this.#driver.version, state: 'ready' });
    this.#resetHeartbeat(ws);
  }

  #activateFallback(reason: string, source?: WebSocket) {
    if (this.#fallbackLocked || this.#options.version !== 12) return;
    this.#fallbackLocked = true;
    this.#driver = new V11Driver();
    this.#bots.clear();
    this.updateConnectionStatus({
      activeVersion: 11,
      fallback: true,
      fallbackReason: reason,
      state: 'offline',
      bots: []
    });
    logger.warn(`[OneBot] OneBot 12 协商失败，已降级并锁定为 v11：${reason}`);
    this.#clearProbe();
    this.#clearHeartbeat();
    rejectPendingActions(new Error(`[OneBot] v12 协商失败：${reason}`));
    if (source && source.readyState !== WebSocket.CLOSED) source.close(1002, 'fallback to onebot v11');
    if (!this.#options.reverse_enable) this.#scheduleReconnect('切换到 OneBot v11', source, true);
  }

  #scheduleReconnect(reason: string, source?: WebSocket, immediate = false) {
    if (this.#options.reverse_enable || this.#reconnectTimer) return;
    const delay = immediate ? 0 : this.#getReconnectDelay();
    this.#reconnectAttempts++;
    logger.info(`[OneBot] ${reason}，${delay}ms 后重新连接（第 ${this.#reconnectAttempts} 次）`);
    this.#reconnectTimer = setTimeout(() => {
      this.#reconnectTimer = null;
      if (source && this.__ws && this.__ws !== source) return;
      if (this.__ws && this.__ws.readyState !== WebSocket.CLOSED) {
        const ws = this.__ws;
        this.__ws = null;
        ws.terminate();
      }
      this.connect();
    }, delay);
  }

  #startProbe(ws: WebSocket) {
    if (!this.isV12) return;
    this.#clearProbe();
    this.#probeTimer = setTimeout(() => {
      if (this.__ws === ws && this.isV12 && this.getConnectionStatus().state !== 'ready') {
        this.#activateFallback(`在 ${probeTimeout / 1000} 秒内未收到 OneBot 12 meta.connect`, ws);
      }
    }, probeTimeout);
  }

  #handleMessage(ws: WebSocket, data: WebSocket.RawData) {
    try {
      const event = JSON.parse(data.toString());
      if (event?.echo) {
        consume(event);
        return;
      }
      if (!event) return;

      if (this.isV12 && this.#driver instanceof V12Driver && !this.#driver.isProtocolMessage(event)) {
        if (new V11Driver().isProtocolMessage(event)) {
          this.#activateFallback('对端发送了 OneBot v11 事件', ws);
          return;
        }
        return;
      }
      if (!this.#driver.isProtocolMessage(event)) return;

      if (this.isV12) {
        const detail = `${event.type}.${event.detail_type}`;
        if (detail === 'meta.connect') {
          if (!this.#driver.isReadyMessage(event)) {
            this.#activateFallback('meta.connect 未声明 onebot_version: "12"', ws);
            return;
          }
          this.#markReady(ws, event);
        } else if (detail === 'meta.status_update') {
          this.#setBotStatus(event.self, Boolean(event.status?.online ?? event.status?.good ?? true));
          this.#resetHeartbeat(ws);
        } else {
          this.#resetHeartbeat(ws);
        }
      } else if (this.getConnectionStatus().state !== 'ready' && this.#driver.isReadyMessage(event)) {
        this.#markReady(ws, event);
      } else {
        this.#resetHeartbeat(ws);
      }
      this.#driver.dispatch(event, (name, payload) => this.#emit(name, payload));
    } catch (error) {
      logger.error('[OneBot] WebSocket 消息解析失败:', error);
    }
  }

  #bindSocket(ws: WebSocket, location: string) {
    this.__ws = ws;
    this.updateConnectionStatus({ state: 'connecting' });
    ws.on('message', data => this.#handleMessage(ws, data));
    ws.on('close', (code, reason) => this.#handleClose(ws, code, reason));
    ws.on('error', error => this.#handleError(ws, error));
    ws.on('unexpected-response', (_request, response) => {
      if (this.isV12 && !this.#fallbackLocked && [400, 404, 426].includes(response.statusCode ?? 0)) {
        this.#activateFallback(`正向连接拒绝 v12 子协议（HTTP ${response.statusCode}）`, ws);
      }
    });
    ws.on('open', () => {
      logger.info(`[OneBot] connected: ${location}`);
      this.#startProbe(ws);
    });
    // Reverse sockets are already open before the connection callback runs.
    if (ws.readyState === WebSocket.OPEN) this.#startProbe(ws);
  }

  #handleClose(ws: WebSocket, code: number, reason: Buffer) {
    if (this.__ws !== ws) return;
    this.#clearProbe();
    this.#clearHeartbeat();
    this.__ws = null;
    this.updateConnectionStatus({ state: 'offline' });
    rejectPendingActions(new Error(`[OneBot] WebSocket 已断开 (${code})，待处理动作已取消`));
    logger.warn(`[OneBot] WebSocket closed: ${code} - ${reason.toString('utf8')}`);
    if (!this.#options.reverse_enable) this.#scheduleReconnect('WebSocket 已关闭', ws);
  }

  #handleError(ws: WebSocket, error: Error) {
    if (this.__ws !== ws) return;
    logger.error('[OneBot] WebSocket error:', error);
    this.updateConnectionStatus({ state: 'offline' });
    rejectPendingActions(new Error('[OneBot] WebSocket 出错，待处理动作已取消'));
    if (!this.#options.reverse_enable) this.#scheduleReconnect('WebSocket 发生错误', ws);
  }

  #isReverseAuthorized(request: import('http').IncomingMessage) {
    const token = this.#options.access_token;
    if (!token) return true;
    const authorization = request.headers.authorization;
    return authorization === `Bearer ${token}` || authorization === token;
  }

  #acceptReverse(ws: WebSocket, request: import('http').IncomingMessage) {
    if (!this.#isReverseAuthorized(request)) {
      logger.warn('[OneBot] 已拒绝未认证的反向 WebSocket 连接');
      ws.close(1008, 'unauthorized');
      return;
    }
    const protocols = String(request.headers['sec-websocket-protocol'] ?? '')
      .split(',')
      .map(item => item.trim());
    if (this.isV12 && !protocols.includes('12')) {
      this.#activateFallback('反向连接未协商 OneBot 12 子协议', ws);
      return;
    }
    if (!this.isV12 && protocols.includes('12') && this.#fallbackLocked) {
      logger.warn('[OneBot] 已锁定为 v11，拒绝 v12 反向连接');
      ws.close(1002, 'onebot v11 locked after fallback');
      return;
    }
    if (this.__ws && this.__ws !== ws) this.__ws.close(1001, 'replaced by newer OneBot connection');
    this.#bindSocket(ws, `ws://127.0.0.1:${this.#options.reverse_port}`);
  }

  connect() {
    if (this.#options.reverse_enable) {
      if (this.#reverseServer) return;
      const server = new WebSocketServer({ port: this.#options.reverse_port });
      this.#reverseServer = server;
      server.on('error', error => logger.error('[OneBot] reverse WebSocket server error:', error));
      server.on('connection', (ws, request) => this.#acceptReverse(ws, request));
      logger.info(`[OneBot] 等待反向 ${this.isV12 ? 'v12' : 'v11'} WebSocket: ws://127.0.0.1:${this.#options.reverse_port}`);
      return;
    }
    if (this.__ws && this.__ws.readyState !== WebSocket.CLOSED) return;
    const headers = this.#options.access_token ? { Authorization: `Bearer ${this.#options.access_token}` } : undefined;
    const ws = this.isV12 ? new WebSocket(this.#options.url, ['12'], { headers }) : new WebSocket(this.#options.url, { headers });
    this.#bindSocket(ws, this.#options.url);
  }
}
