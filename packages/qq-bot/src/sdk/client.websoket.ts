import WebSocket from 'ws';
import { QQBotAPI } from './api.js';
import { getIntentsMask } from './intents.js';
import { QQBotEventMap } from './message.js';
import { Options } from './typing.js';
import { FileSessionStore, SessionStore } from './session.js';

const normalizeGatewayMessage = <T extends { id?: string; d?: Record<string, unknown> }>(message: T): T => {
  if (!message?.id || !message?.d || typeof message.d !== 'object' || Array.isArray(message.d)) {
    return message;
  }

  if (message.d.id === undefined || message.d.id === null || message.d.id === '') {
    message.d.id = message.id;
  }

  return message;
};

/**
 * QQ 机器人网关连接。
 *
 * 网关会主动发送 op=7 要求客户端重新连接，也可能因网络或重复连接被关闭。
 * 因此重连必须由客户端统一调度，避免旧 socket 的 close 事件重复创建连接。
 */
export class QQBotClients extends QQBotAPI {
  #isConnected = false;

  #stopped = false;

  #sessionId: string | null = null;

  #sessionStore: SessionStore;

  #sessionLoaded = false;

  #sequence: number | null = null;

  #heartbeatAcknowledged = true;

  #heartbeatInterval = 30000;

  #heartbeatTimer: NodeJS.Timeout | null = null;

  #accessTokenTimer: NodeJS.Timeout | null = null;

  #accessTokenTask: Promise<void> | null = null;

  #reconnectTimer: NodeJS.Timeout | null = null;

  #reconnectAttempts = 0;

  #gatewayUrl: string | null = null;

  #ws: WebSocket | null = null;

  #events: {
    [K in keyof QQBotEventMap]?: ((event: QQBotEventMap[K]) => any)[];
  } = {};

  /**
   * 设置配置
   * @param option
   */
  constructor(option: Options) {
    super(option);
    this.#sessionStore = option.sessionStore || new FileSessionStore();
  }

  async #loadSession() {
    if (this.#sessionLoaded) return;
    this.#sessionLoaded = true;
    const botId = String(this.config.get('app_id') || '');
    const session = botId ? await this.#sessionStore.load(botId) : null;

    if (session) {
      this.#sessionId = session.sessionId;
      this.#sequence = session.sequence;
    }
  }

  #persistSession() {
    const botId = String(this.config.get('app_id') || '');
    if (!botId || !this.#sessionId || this.#sequence === null) return;
    void this.#sessionStore.save({ botId, sessionId: this.#sessionId, sequence: this.#sequence }).catch(err => {
      console.warn('[ws-qqbot] session persistence failed', err);
    });
  }

  #clearSession() {
    const botId = String(this.config.get('app_id') || '');
    this.#sessionId = null;
    this.#sequence = null;
    if (botId) void this.#sessionStore.clear(botId).catch(() => undefined);
  }

  #clearHeartbeat() {
    if (this.#heartbeatTimer) {
      clearInterval(this.#heartbeatTimer);
      this.#heartbeatTimer = null;
    }
  }

  #startHeartbeat(ws: WebSocket) {
    this.#clearHeartbeat();

    this.#heartbeatTimer = setInterval(() => {
      if (this.#ws !== ws || !this.#isConnected || ws.readyState !== WebSocket.OPEN) {
        this.#clearHeartbeat();

        return;
      }

      if (!this.#heartbeatAcknowledged) {
        this.#requestReconnect('heartbeat acknowledgement timeout');

        return;
      }

      try {
        this.#heartbeatAcknowledged = false;
        this.updateConnectionStatus({ heartbeatAcknowledged: false });
        ws.send(
          JSON.stringify({
            op: 1,
            d: null
          })
        );
      } catch (err) {
        console.error('[ws-qqbot] heartbeat failed', err);
        this.#requestReconnect('heartbeat failed');
      }
    }, this.#heartbeatInterval);
  }

  #getReconnectDelay() {
    const delay = Math.min(1000 * 2 ** Math.min(this.#reconnectAttempts, 5), 30000);
    const jitter = Math.floor(Math.random() * Math.min(1000, Math.floor(delay / 4)));

    return delay + jitter;
  }

  #scheduleReconnect(reason: string) {
    if (this.#stopped || this.#reconnectTimer) {
      return;
    }

    const delay = this.#getReconnectDelay();

    this.#reconnectAttempts++;
    this.updateConnectionStatus({
      state: 'reconnecting',
      reconnectAttempts: this.#reconnectAttempts,
      heartbeatAcknowledged: this.#heartbeatAcknowledged,
      lastError: reason
    });
    console.info(`[ws-qqbot] ${reason}; reconnecting in ${delay}ms (attempt ${this.#reconnectAttempts})`);

    this.#reconnectTimer = setTimeout(() => {
      this.#reconnectTimer = null;
      void this.connect();
    }, delay);
  }

  #requestReconnect(reason: string) {
    this.#isConnected = false;
    this.#clearHeartbeat();
    // C2C stream sessions are tied to the current gateway lifecycle. They
    // cannot be safely resumed after a transport interruption.
    this.cancelStreams();
    this.#scheduleReconnect(reason);

    const ws = this.#ws;

    if (ws && ws.readyState !== WebSocket.CLOSED && ws.readyState !== WebSocket.CLOSING) {
      ws.close();
    }
  }

  /** Stops reconnecting and releases the active gateway socket. */
  disconnect() {
    this.#stopped = true;
    this.#isConnected = false;
    this.#clearHeartbeat();
    if (this.#reconnectTimer) {
      clearTimeout(this.#reconnectTimer);
    }
    if (this.#accessTokenTimer) {
      clearTimeout(this.#accessTokenTimer);
    }
    this.#reconnectTimer = null;
    this.#accessTokenTimer = null;
    const ws = this.#ws;

    this.#ws = null;
    this.cancelStreams();
    if (ws && ws.readyState !== WebSocket.CLOSED) {
      ws.close(1000, 'client stopped');
    }
    this.updateConnectionStatus({ state: 'stopped', heartbeatAcknowledged: false });
  }

  #scheduleAccessTokenRefresh(delay: number) {
    if (this.#accessTokenTimer) {
      clearTimeout(this.#accessTokenTimer);
    }

    this.#accessTokenTimer = setTimeout(() => {
      this.#accessTokenTimer = null;
      void this.#startAccessTokenRefresh().catch(() => undefined);
    }, delay);
  }

  async #refreshAccessToken() {
    const appId = this.config.get('app_id');
    const secret = this.config.get('secret');

    if (!appId || !secret) {
      throw new Error('QQ Bot app_id or secret is missing');
    }

    try {
      const data: {
        access_token: string;
        expires_in: number;
      } = await this.getAuthentication();

      if (!data?.access_token) {
        throw new Error('QQ Bot access token is empty');
      }

      this.config.set('access_token', data.access_token);
      const expiresIn = Number(data.expires_in);
      const refreshIn = Math.max(60000, (Number.isFinite(expiresIn) ? expiresIn * 1000 : 3600000) - 60000);

      this.#scheduleAccessTokenRefresh(refreshIn);
      console.info(`[ws-qqbot] access token refreshed; next refresh in ${refreshIn}ms`);
    } catch (err) {
      this.#scheduleAccessTokenRefresh(30000);
      console.error('[ws-qqbot] access token refresh failed; retrying in 30000ms', err);
      throw err;
    }
  }

  #startAccessTokenRefresh() {
    if (this.#accessTokenTask === null) {
      this.#accessTokenTask = this.#refreshAccessToken().finally(() => {
        this.#accessTokenTask = null;
      });
    }

    return this.#accessTokenTask;
  }

  async #ensureAccessToken() {
    if (this.#accessTokenTimer) {
      return;
    }

    await this.#startAccessTokenRefresh();
  }

  /**
   * 鉴权数据
   * @returns WebSocket Identify 数据
   */
  #aut() {
    const token = this.config.get('access_token');
    const intents = this.config.get('intents');
    const shard = this.config.get('shard');

    return {
      op: 2,
      d: {
        token: `QQBot ${token}`,
        intents: getIntentsMask(intents),
        shard,
        properties: {
          $os: process.platform,
          $browser: 'alemonjs',
          $device: 'alemonjs'
        }
      }
    };
  }

  #resume() {
    return {
      op: 6,
      d: {
        token: `QQBot ${this.config.get('access_token')}`,
        session_id: this.#sessionId,
        seq: this.#sequence
      }
    };
  }

  /**
   * 注册事件处理程序
   * @param key 事件名称
   * @param val 事件处理函数
   */
  on<T extends keyof QQBotEventMap>(key: T, val: (event: QQBotEventMap[T]) => any) {
    if (!this.#events[key]) {
      this.#events[key] = [];
    }
    this.#events[key].push(val);

    return this;
  }

  #emitError(err: unknown) {
    for (const event of this.#events.ERROR || []) {
      try {
        event(err as never);
      } catch (error) {
        console.error('[ws-qqbot] error handler failed', error);
      }
    }
  }

  #handleDispatch(t: keyof QQBotEventMap, d: unknown) {
    for (const event of this.#events[t] || []) {
      try {
        event(d as never);
      } catch (err) {
        this.#emitError(err);
      }
    }
  }

  /**
   * 建立或恢复网关连接。
   */
  async connect(gatewayURL?: string) {
    this.#stopped = false;
    if (gatewayURL) {
      this.#gatewayUrl = gatewayURL;
    }

    if (this.#ws && this.#ws.readyState !== WebSocket.CLOSED) {
      return;
    }

    await this.#loadSession();

    try {
      await this.#ensureAccessToken();
    } catch {
      this.#scheduleReconnect('access token unavailable');

      return;
    }

    if (!this.#gatewayUrl) {
      try {
        this.#gatewayUrl = await this.gateway().then(res => res?.url);
      } catch (err) {
        this.#emitError(err);
        this.#scheduleReconnect('gateway request failed');

        return;
      }
    }

    if (!this.#gatewayUrl) {
      this.#scheduleReconnect('gateway URL is empty');

      return;
    }

    let ws: WebSocket;

    try {
      ws = new WebSocket(this.#gatewayUrl);
    } catch (err) {
      this.#emitError(err);
      this.#scheduleReconnect('gateway connection creation failed');

      return;
    }

    this.#ws = ws;
    this.updateConnectionStatus({ state: 'connecting', transport: 'websocket', lastError: undefined });
    ws.on('open', () => {
      if (this.#ws === ws) {
        console.info('[ws-qqbot] open');
      }
    });

    ws.on('message', msg => {
      if (this.#ws !== ws) {
        return;
      }

      try {
        const message = normalizeGatewayMessage(JSON.parse(msg.toString('utf8')));

        if (process.env.NTQQ_WS === 'dev') {
          console.info('message', message);
        }

        const map = {
          0: ({ t, d, s }) => {
            if (typeof s === 'number') {
              this.#sequence = s;
            }
            if (t === 'READY' && d?.session_id) {
              this.#sessionId = String(d.session_id);
            }
            this.#persistSession();
            this.#handleDispatch(t, d);
            if (t === 'READY' || t === 'RESUMED') {
              this.#reconnectAttempts = 0;
              this.updateConnectionStatus({
                state: 'ready',
                reconnectAttempts: 0,
                heartbeatAcknowledged: this.#heartbeatAcknowledged,
                sessionId: this.#sessionId ?? undefined,
                sequence: this.#sequence ?? undefined,
                resumed: t === 'RESUMED'
              });
              console.info(t === 'READY' ? '[ws-qqbot] ready' : '[ws-qqbot] restored connection');
            }
          },
          7: ({ d }) => {
            console.info('[ws-qqbot] gateway requested reconnect', d);
            this.#requestReconnect('gateway requested reconnect');
          },
          9: ({ d }) => {
            console.error('[ws-qqbot] invalid session', d);
            this.#clearSession();
            this.#requestReconnect('invalid session');
          },
          10: ({ d }) => {
            this.#isConnected = true;
            this.#heartbeatInterval = Number(d?.heartbeat_interval) || 30000;
            this.#startHeartbeat(ws);

            try {
              const resumable = this.#sessionId && this.#sequence !== null;

              ws.send(JSON.stringify(resumable ? this.#resume() : this.#aut()));
              this.updateConnectionStatus({
                state: 'connecting',
                heartbeatAcknowledged: true,
                sessionId: this.#sessionId ?? undefined,
                sequence: this.#sequence ?? undefined,
                resumed: Boolean(resumable)
              });
            } catch (err) {
              console.error('[ws-qqbot] identify failed', err);
              this.#emitError(err);
              this.#requestReconnect('identify failed');
            }
          },
          11: () => {
            this.#heartbeatAcknowledged = true;
            this.updateConnectionStatus({ heartbeatAcknowledged: true });
            console.debug('[ws-qqbot] heartbeat acknowledged');
          },
          12: ({ d }) => {
            console.debug('[ws-qqbot] platform data', d);
          }
        };

        if (map[message.op]) {
          map[message.op](message);
        }
      } catch (err) {
        console.error('[ws-qqbot] invalid gateway message', err);
        this.#emitError(err);
      }
    });

    ws.on('close', (code, reason) => {
      if (this.#ws !== ws) {
        return;
      }

      this.#ws = null;
      this.#isConnected = false;
      this.#clearHeartbeat();
      this.updateConnectionStatus({ state: 'offline', heartbeatAcknowledged: false });
      console.info(`[ws-qqbot] close ${code}${reason.length ? `: ${reason.toString('utf8')}` : ''}`);
      this.#scheduleReconnect('connection closed');
    });

    ws.on('error', err => {
      if (this.#ws !== ws) {
        return;
      }

      console.error('[ws-qqbot] error', err);
      this.updateConnectionStatus({ state: 'offline', lastError: err.message });
      this.#emitError(err);
      this.#requestReconnect('connection error');
    });
  }
}
