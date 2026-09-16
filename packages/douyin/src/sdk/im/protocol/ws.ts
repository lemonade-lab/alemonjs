// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
import { createHash } from 'node:crypto';
import { logger } from '../../logger.js';
import WebSocket, { type RawData } from 'ws';

/**
 * Cookie 鉴权 Android Frontier WS 客户端底层（等价迁移自 android-ws.ts 的连接部分，
 * 并参考 ws-client.ts 的连接生命周期）。
 * 仅负责：连接、心跳、指数退避重连、帧字节分发；消息解析与发送属业务层。
 * 不打印日志：正常重连等事件全部通过回调通知，由上层决定记录策略。
 */

const ANDROID_FRONTIER = 'wss://frontier-aweme-lf-ipainner.amemv.com/ws/v2';

export const ANDROID_APP_KEY = 'e1bd35ec9db7b8d846de66ed140b1ad9';
export const ANDROID_ACCESS_SALT = 'f8a69f1719916z';
export const ANDROID_UA = 'okhttp/3.12.1 com.ss.android.ugc.aweme/280400';
export const ANDROID_SDK_VERSION = '5.0.3.0-rc.11-SNAPSHOT';

export function buildAndroidFrontierUrl(userId: string, now = Date.now()): string {
  const accessKey = createHash('md5').update(`9${ANDROID_APP_KEY}${userId}${ANDROID_ACCESS_SALT}`).digest('hex');
  const params = new URLSearchParams({
    aid: '1128',
    fpid: '9',
    sdk_version: '3',
    device_id: userId,
    iid: userId,
    access_key: accessKey,
    pl: '0',
    ne: '1',
    version_code: '280400',
    version_name: '28.4.0',
    update_version_code: '28409900',
    platform: '0',
    monitor_service_id_list: '[]',
    is_background: '0',
    'ping-interval': '30',
    qos_level: '2',
    qos_sdk_version: '2',
    ttnet_ignore_offline: '1',
    ws_connect_protocol: '0',
    device_platform: 'android',
    os: 'android',
    app_name: 'aweme',
    package: 'com.ss.android.ugc.aweme',
    channel: 'douyinweb1_64',
    ac: 'wifi',
    language: 'zh',
    device_type: '24031PN0DC',
    device_brand: 'XIAOMI',
    os_api: '34',
    os_version: '14',
    ts: String(Math.floor(now / 1000)),
    _rticket: String(Math.floor(now / 1000) * 1000)
  });

  return `${ANDROID_FRONTIER}?${params}`;
}

/** 指数退避：1s, 2s, 4s, ... 封顶 30s */
export function reconnectDelay(attempt: number): number {
  return Math.min(30_000, 1_000 * 2 ** Math.max(0, attempt - 1));
}

export function cookieValue(cookies: string, name: string): string | undefined {
  const entry = cookies
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(`${name}=`));

  if (!entry) {
    return undefined;
  }
  const value = entry.slice(name.length + 1);

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export interface WsReconnectEvent {
  attempt: number;
  delayMs: number;
  code?: number;
  reason?: string;
}

export interface WsCloseEvent {
  code?: number;
  reason?: string;
}

export interface AndroidFrontierWsOptions {
  userId: string;
  cookies: string;
  /** Read refreshed cookies before each reconnect. */
  getCookies?: () => string;
  deviceId?: string;
  /** 事件回调 */
  callbacks?: AndroidFrontierWsCallbacks;
  /** @internal transport seam for deterministic tests. */
  webSocketFactory?: (url: string, protocols: string[], options: { headers: Record<string, string>; handshakeTimeout: number }) => WebSocket;
}

export interface AndroidFrontierWsCallbacks {
  onOpen?: () => void;
  /** 二进制帧分发：原始字节交给业务层解析 */
  onMessage?: (bytes: Uint8Array) => void;
  onClose?: (event: WsCloseEvent) => void;
  onReconnecting?: (event: WsReconnectEvent) => void;
  onError?: (error: Error) => void;
}

function toBytes(data: RawData): Uint8Array {
  return Buffer.isBuffer(data) ? data : Array.isArray(data) ? Buffer.concat(data) : Buffer.from(data as ArrayBuffer);
}

/** Android Frontier WS：连接 / 15s 心跳 / 指数退避重连 / 帧分发 */
export class AndroidFrontierWs {
  private socket?: WebSocket;
  private heartbeat?: ReturnType<typeof setInterval>;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private connectTask?: Promise<void>;
  private cancelConnect?: (error: Error) => void;
  private reconnectAttempt = 0;
  private stopped = true;
  private hasConnected = false;

  constructor(private readonly options: AndroidFrontierWsOptions) {}

  get connected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  connect(): Promise<void> {
    if (this.connected) {
      return Promise.resolve();
    }
    if (this.connectTask !== undefined) {
      return this.connectTask;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    delete this.reconnectTimer;
    this.stopped = false;
    const task = this.openSocket();

    this.connectTask = task;
    void task.then(
      () => this.clearConnectTask(task),
      () => this.clearConnectTask(task)
    );

    return task;
  }

  close(): void {
    this.stopped = true;
    this.hasConnected = false;
    this.reconnectAttempt = 0;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    delete this.reconnectTimer;
    this.stopHeartbeat();
    this.cancelConnect?.(new Error('WebSocket connection stopped'));
    delete this.cancelConnect;
    delete this.connectTask;
    const socket = this.socket;

    delete this.socket;
    if (socket?.readyState === WebSocket.CONNECTING) {
      socket.terminate();
    } else {
      socket?.close();
    }
  }

  private openSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = buildAndroidFrontierUrl(this.options.userId);
      const socket = this.createSocket(url, this.buildHeaders());

      this.socket = socket;
      let opened = false;
      let settled = false;
      const fail = (error: Error) => {
        if (settled) {
          return;
        }
        settled = true;
        if (this.cancelConnect === fail) {
          delete this.cancelConnect;
        }
        reject(error);
      };

      this.cancelConnect = fail;
      socket.once('error', fail);
      // 握手被拒时透出服务端诊断头（如 handshake-msg: invalid device id）
      socket.once('unexpected-response', (_req, res) => {
        const msg = String(res.headers['handshake-msg'] ?? '');

        logger.debug(`[douyin:ws] 握手失败 HTTP ${res.statusCode} ${msg}`);
        res.resume();
        fail(new Error(`WebSocket handshake rejected: HTTP ${res.statusCode}`));
        socket.terminate();
      });
      socket.once('open', () => {
        if (this.stopped || this.socket !== socket) {
          socket.close();
          resolve();

          return;
        }
        opened = true;
        settled = true;
        if (this.cancelConnect === fail) {
          delete this.cancelConnect;
        }
        socket.off('error', fail);
        this.reconnectAttempt = 0;
        this.hasConnected = true;
        logger.debug(`[douyin:ws] 已连接 ${url.slice(0, 80)}...`);
        this.heartbeat = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.ping();
          }
        }, 15_000);
        this.options.callbacks?.onOpen?.();
        resolve();
      });
      socket.on('message', (data: RawData) => {
        if (this.socket !== socket || this.stopped) {
          return;
        }
        const bytes = toBytes(data);

        logger.debug(`[douyin:ws] 收到帧 ${bytes.length}B`);
        try {
          this.options.callbacks?.onMessage?.(bytes);
        } catch (error) {
          this.options.callbacks?.onError?.(error instanceof Error ? error : new Error(String(error)));
        }
      });
      socket.on('close', (code, reason) => {
        const text = reason.toString();

        if (!opened) {
          fail(new Error(`WebSocket closed before open: code=${code} reason=${text}`));
        }
        if (this.socket !== socket) {
          return;
        }
        this.stopHeartbeat();
        delete this.socket;
        this.options.callbacks?.onClose?.({ code, reason: text });
        if (!this.stopped && this.hasConnected) {
          this.scheduleReconnect(code, text);
        }
      });
      socket.on('error', error => {
        logger.debug(`[douyin:ws] 连接错误: ${error.message}`);
        this.options.callbacks?.onError?.(error);
      });
    });
  }

  private createSocket(url: string, headers: Record<string, string>): WebSocket {
    const socketOptions = { headers, handshakeTimeout: 30_000 };

    return this.options.webSocketFactory ? this.options.webSocketFactory(url, ['pbbp2'], socketOptions) : new WebSocket(url, ['pbbp2'], socketOptions);
  }

  /**
   * 一次性连接发送帧并等待响应提取（Android cmd=100 直发）。
   * 返回 undefined 表示超时/连接失败/未匹配到响应。
   */
  async sendOnce<T>(frame: Uint8Array, extract: (payload: Uint8Array) => T | undefined, ackTimeoutMs = 4_000): Promise<T | undefined> {
    return await new Promise(resolve => {
      const url = buildAndroidFrontierUrl(this.options.userId);
      const socket = this.createSocket(url, this.buildHeaders());
      let settled = false;
      let ackTimer: NodeJS.Timeout | undefined;
      const finish = (result: T | undefined) => {
        if (settled) {
          return;
        }
        settled = true;
        if (ackTimer) {
          clearTimeout(ackTimer);
        }
        clearTimeout(connectTimer);
        socket.off('message', onMessage);
        try {
          if (socket.readyState === WebSocket.OPEN) {
            socket.close();
          } else if (socket.readyState === WebSocket.CONNECTING) {
            socket.terminate();
          }
        } catch {
          // 结果已定，清理即可
        }
        resolve(result);
      };
      const onMessage = (data: RawData) => {
        const bytes = Buffer.isBuffer(data) ? data : Array.isArray(data) ? Buffer.concat(data) : Buffer.from(data as ArrayBuffer);
        const result = extract(bytes);

        if (result !== undefined) {
          finish(result);
        }
      };

      socket.once('open', () => {
        ackTimer = setTimeout(() => finish(undefined), ackTimeoutMs);
        socket.send(frame, error => {
          if (error) {
            finish(undefined);
          }
        });
      });
      socket.on('message', onMessage);
      socket.once('close', () => finish(undefined));
      socket.once('error', () => finish(undefined));
      const connectTimer = setTimeout(() => finish(undefined), 30_000);
    });
  }

  private buildHeaders(): Record<string, string> {
    const cookies = this.options.getCookies?.() ?? this.options.cookies;
    const headers: Record<string, string> = {
      'User-Agent': ANDROID_UA,
      Origin: 'wss://frontier-aweme-lf-ipainner.amemv.com',
      Cookie: cookies,
      'x-support-qos2': '1',
      'x-support-ack': '1',
      'sdk-version': '2',
      'passport-sdk-version': '601504',
      'X-SS-DP': '1128',
      'x-tt-store-region': 'cn',
      'x-tt-store-region-src': 'uid',
      'x-bd-kmsv': '1'
    };
    const tlbTag = cookieValue(cookies, 'session_tlb_tag');
    const mfaToken = cookieValue(cookies, 'passport_mfa_token');

    if (tlbTag) {
      headers['session-tlb-tag'] = tlbTag;
    }
    if (mfaToken) {
      headers['x-tt-passport-mfa-token'] = mfaToken;
    }

    return headers;
  }

  private scheduleReconnect(code?: number, reason?: string): void {
    if (this.stopped || this.reconnectTimer) {
      return;
    }
    const attempt = ++this.reconnectAttempt;
    const delayMs = reconnectDelay(attempt);
    const event: WsReconnectEvent = { attempt, delayMs };

    if (code !== null && code !== undefined) {
      event.code = code;
    }
    if (reason) {
      event.reason = reason;
    }
    this.options.callbacks?.onReconnecting?.(event);
    this.reconnectTimer = setTimeout(() => {
      delete this.reconnectTimer;
      if (this.stopped) {
        return;
      }
      void this.connect().catch(() => this.scheduleReconnect());
    }, delayMs);
  }

  private clearConnectTask(task: Promise<void>): void {
    if (this.connectTask === task) {
      delete this.connectTask;
    }
  }

  private stopHeartbeat(): void {
    if (this.heartbeat) {
      clearInterval(this.heartbeat);
    }
    delete this.heartbeat;
  }
}
