import WebSocket from 'ws';
import http from 'http';
import { logger } from 'alemonjs';
import { MilkyAPI } from './api';
import type { MilkyEventMap } from './typing';
import type { MilkyEvent } from './types';

export type MilkyClientOptions = {
  host: string;
  port: number;
  prefix?: string;
  connection?: 'ws' | 'sse' | 'webhook';
  access_token?: string;
  http_timeout?: number;
  heartbeat?: number;
  reconnect_interval?: number;
  webhook_path?: string;
  webhook_port?: number;
};

const defaultReconnect = 10_000;
const defaultHeartbeat = 30_000;

/**
 * Milky 事件传输客户端。
 *
 * 协议端在 /event 提供 SSE 与 WebSocket 事件推送，也支持 WebHook。
 * API 调用统一走 MilkyAPI 的 POST /api/:action。
 */
export class MilkyClient extends MilkyAPI {
  #options: MilkyClientOptions;
  #events: { [K in keyof MilkyEventMap]?: (event: any) => any } = {};
  #ws: WebSocket | null = null;
  #server: http.Server | null = null;
  #sseRequest: http.ClientRequest | null = null;
  #heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  #reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  #reconnectAttempts = 0;
  #closedByUser = false;

  constructor(options: MilkyClientOptions) {
    const baseUrl = MilkyClient.buildBaseUrl(options);
    const apiBaseUrl = `${baseUrl}/api`;

    super({
      baseUrl,
      apiBaseUrl,
      accessToken: options.access_token ?? '',
      timeoutMs: (options.http_timeout ?? 15) * 1000
    });

    this.#options = {
      ...options,
      prefix: options.prefix ?? '',
      connection: options.connection ?? 'ws',
      heartbeat: (options.heartbeat ?? 30) * 1000,
      reconnect_interval: (options.reconnect_interval ?? 10) * 1000,
      webhook_path: options.webhook_path ?? '/milky',
      webhook_port: options.webhook_port ?? 17159
    };

    this.updateConnectionStatus({
      state: 'idle',
      transport: this.#options.connection
    });
  }

  static buildBaseUrl(options: MilkyClientOptions) {
    const prefix = options.prefix ? `/${String(options.prefix).replace(/^\/+|\/+$/g, '')}` : '';
    const host = options.host;

    if (/^https?:\/\//.test(host)) {
      const url = new URL(host);

      if (!url.port && options.port) {
        url.port = String(options.port);
      }
      const path = url.pathname.replace(/\/+$/, '');

      return `${url.protocol}//${url.host}${path}${prefix}`;
    }

    return `http://${host}:${options.port}${prefix}`;
  }

  get connectionMode() {
    return this.#options.connection;
  }

  #buildEventUrl(kind: 'ws' | 'http') {
    const url = new URL(`${this.apiBaseUrl.replace(/\/api$/, '')}/event`);

    if (kind === 'ws') {
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    }

    return url;
  }

  #emit(name: string, event: any) {
    this.#events[name as keyof MilkyEventMap]?.(event);
  }

  on<T extends keyof MilkyEventMap>(key: T, val: (event: MilkyEventMap[T]) => any) {
    this.#events[key] = val;

    return this;
  }

  #isAuthorized(request: http.IncomingMessage) {
    const token = this.#options.access_token;

    if (!token) {
      return true;
    }
    const authorization = request.headers.authorization;

    return authorization === `Bearer ${token}` || authorization === token;
  }

  #clearHeartbeat() {
    if (this.#heartbeatTimer) {
      clearInterval(this.#heartbeatTimer);
    }
    this.#heartbeatTimer = null;
  }

  #startHeartbeat(ws: WebSocket) {
    this.#clearHeartbeat();
    this.#heartbeatTimer = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.ping();
        } catch (error: any) {
          logger.warn(`[Milky] WebSocket 心跳失败: ${error?.message ?? error}`);
        }
      }
    }, this.#options.heartbeat ?? defaultHeartbeat);
  }

  #resetReconnectAttempts() {
    this.#reconnectAttempts = 0;
  }

  #getReconnectDelay() {
    const base = this.#options.reconnect_interval ?? defaultReconnect;

    return Math.min(base * 2 ** Math.min(this.#reconnectAttempts, 5), 30_000);
  }

  #scheduleReconnect(reason: string) {
    if (this.#options.connection === 'webhook' || this.#closedByUser) {
      return;
    }
    if (this.#reconnectTimer) {
      return;
    }

    this.#reconnectAttempts++;
    const delay = this.#getReconnectDelay();

    logger.info(`[Milky] ${reason}，${delay}ms 后重新连接（第 ${this.#reconnectAttempts} 次）`);
    this.#reconnectTimer = setTimeout(() => {
      this.#reconnectTimer = null;
      this.connect();
    }, delay);
  }

  async #onConnect() {
    try {
      const loginInfo = await this.getLoginInfo();

      if (loginInfo.retcode !== 0 || !loginInfo.data) {
        const reason = loginInfo.error || loginInfo.wording || 'unknown error';

        this.updateConnectionStatus({ state: 'failed', reason: `获取登录信息失败: ${reason}` });
        logger.error(`[Milky] 获取登录信息失败: ${reason}`);
        if (this.#options.connection !== 'webhook') {
          this.#ws?.close(1000, 'login failed');
        }
        if (this.#options.connection !== 'webhook') {
          this.#scheduleReconnect('初始化失败');
        }

        return;
      }

      const selfId = String(loginInfo.data.uin ?? loginInfo.data.user_id ?? '');

      this.updateConnectionStatus({ state: 'ready', selfId });
      logger.mark(`[Milky] ${loginInfo.data.nickname ?? 'Bot'}(${selfId}) 已连接`);
      this.#emit('READY', { self_id: selfId, info: loginInfo.data } as MilkyEventMap['READY']);
    } catch (error: any) {
      this.updateConnectionStatus({ state: 'failed', reason: error?.message ?? String(error) });
      logger.error(`[Milky] 初始化失败: ${error?.stack ?? error?.message ?? error}`);
      if (this.#options.connection !== 'webhook') {
        this.#scheduleReconnect('初始化失败');
      }
    }
  }

  #handleEvent(event: MilkyEvent) {
    if (!event?.event_type) {
      logger.debug(`[Milky] 收到未知数据: ${JSON.stringify(event)}`);

      return;
    }

    logger.debug(`[Milky] 收到事件: ${event.event_type}`);
    this.#emit('EVENT', event);
  }

  #connectWs() {
    if (this.#ws && this.#ws.readyState === WebSocket.OPEN) {
      return;
    }

    const url = this.#buildEventUrl('ws');

    if (this.#options.access_token) {
      url.searchParams.set('access_token', this.#options.access_token);
    }

    const headers = this.#options.access_token ? { Authorization: `Bearer ${this.#options.access_token}` } : undefined;
    const ws = new WebSocket(url, { headers });

    this.#ws = ws;
    this.updateConnectionStatus({ state: 'connecting', transport: 'ws' });

    ws.on('open', () => {
      logger.info(`[Milky] WebSocket 已连接: ${url}`);
      this.#resetReconnectAttempts();
      this.#startHeartbeat(ws);
      void this.#onConnect();
    });

    ws.on('message', data => {
      this.#startHeartbeat(ws);
      try {
        const event = JSON.parse(data.toString());

        this.#handleEvent(event);
      } catch (error: any) {
        logger.error(`[Milky] WebSocket 消息解析失败: ${error?.message ?? error}`);
      }
    });

    ws.on('close', (code, reason) => {
      if (this.#ws !== ws) {
        return;
      }
      this.#clearHeartbeat();
      this.#ws = null;
      this.updateConnectionStatus({ state: 'offline', reason: `WebSocket 已断开 (${code})` });
      logger.warn(`[Milky] WebSocket 已断开: ${code} - ${reason.toString('utf8')}`);
      this.#scheduleReconnect('WebSocket 已断开');
    });

    ws.on('error', (error: Error) => {
      if (this.#ws !== ws) {
        return;
      }
      logger.error(`[Milky] WebSocket 错误: ${error.message}`);
      this.updateConnectionStatus({ state: 'offline', reason: error.message });
      this.#scheduleReconnect('WebSocket 发生错误');
    });
  }

  #connectSse() {
    const url = this.#buildEventUrl('http');

    if (this.#options.access_token) {
      url.searchParams.set('access_token', this.#options.access_token);
    }

    const headers: Record<string, string> = {
      Accept: 'text/event-stream'
    };

    if (this.#options.access_token) {
      headers.Authorization = `Bearer ${this.#options.access_token}`;
    }

    const req = http.get(url, { headers }, res => {
      if (res.statusCode !== 200) {
        this.updateConnectionStatus({ state: 'failed', reason: `SSE HTTP ${res.statusCode}` });
        req.destroy();
        this.#scheduleReconnect('SSE 连接失败');

        return;
      }

      this.#resetReconnectAttempts();
      this.updateConnectionStatus({ state: 'connecting', transport: 'sse' });
      logger.info(`[Milky] SSE 已连接: ${url}`);
      void this.#onConnect();

      let buffer = '';

      res.setEncoding('utf8');

      res.on('data', (chunk: string) => {
        buffer += chunk;

        // SSE 事件以空行分隔，这里只处理 data: 行。
        const events = buffer.split(/\r?\n\r?\n/);

        buffer = events.pop() ?? '';

        for (const block of events) {
          const dataLines = block
            .split(/\r?\n/)
            .filter(line => line.startsWith('data:'))
            .map(line => line.slice(5).trimStart());

          if (dataLines.length <= 0) {
            continue;
          }

          try {
            const event = JSON.parse(dataLines.join('\n'));

            this.#handleEvent(event);
          } catch (error: any) {
            logger.error(`[Milky] SSE 消息解析失败: ${error?.message ?? error}`);
          }
        }
      });

      res.on('close', () => {
        if (this.#sseRequest !== req) {
          return;
        }
        this.#sseRequest = null;
        this.updateConnectionStatus({ state: 'offline', reason: 'SSE 已断开' });
        logger.warn('[Milky] SSE 已断开');
        this.#scheduleReconnect('SSE 已断开');
      });

      res.on('error', (error: Error) => {
        logger.error(`[Milky] SSE 错误: ${error.message}`);
        this.updateConnectionStatus({ state: 'offline', reason: error.message });
        this.#scheduleReconnect('SSE 发生错误');
      });
    });

    this.#sseRequest = req;

    req.on('error', (error: Error) => {
      logger.error(`[Milky] SSE 请求错误: ${error.message}`);
      this.updateConnectionStatus({ state: 'offline', reason: error.message });
      this.#scheduleReconnect('SSE 请求错误');
    });
  }

  #startWebhook() {
    if (this.#server) {
      return;
    }

    const server = http.createServer((req, res) => {
      const path = (req.url ?? '/').split('?')[0];

      if (req.method !== 'POST' || path !== this.#options.webhook_path) {
        res.statusCode = 404;
        res.end('not found');

        return;
      }

      if (!this.#isAuthorized(req)) {
        logger.warn('[Milky] 已拒绝未认证的 WebHook 请求');
        res.statusCode = 401;
        res.end('unauthorized');

        return;
      }

      let body = '';

      req.on('data', chunk => {
        body += chunk;
      });

      req.on('end', () => {
        try {
          const event = JSON.parse(body || '{}');

          this.#handleEvent(event);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'ok', retcode: 0, data: {} }));
        } catch (error: any) {
          logger.error(`[Milky] WebHook 处理失败: ${error?.message ?? error}`);
          res.statusCode = 400;
          res.end('bad request');
        }
      });
    });

    this.#server = server;
    server.on('error', error => {
      logger.error(`[Milky] WebHook server error: ${error.message}`);
    });

    server.listen(this.#options.webhook_port ?? 17159, () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : this.#options.webhook_port;

      logger.info(`[Milky] WebHook 已监听: http://127.0.0.1:${port}${this.#options.webhook_path}`);
      this.updateConnectionStatus({ state: 'connecting', transport: 'webhook' });
      void this.#onConnect();
    });
  }

  connect() {
    this.#closedByUser = false;

    switch (this.#options.connection) {
      case 'ws':
        this.#connectWs();
        break;
      case 'sse':
        this.#connectSse();
        break;
      case 'webhook':
        this.#startWebhook();
        break;
      default:
        this.updateConnectionStatus({
          state: 'failed',
          reason: `不支持的连接方式: ${String(this.#options.connection)}`
        });
        break;
    }
  }

  close() {
    this.#closedByUser = true;
    this.#clearHeartbeat();
    if (this.#reconnectTimer) {
      clearTimeout(this.#reconnectTimer);
      this.#reconnectTimer = null;
    }
    if (this.#sseRequest) {
      this.#sseRequest.destroy();
      this.#sseRequest = null;
    }
    if (this.#ws) {
      this.#ws.close(1000, 'adapter closing');
      this.#ws = null;
    }
    if (this.#server) {
      this.#server.close();
      this.#server = null;
    }
    this.updateConnectionStatus({ state: 'offline', reason: 'adapter closing' });
  }
}
