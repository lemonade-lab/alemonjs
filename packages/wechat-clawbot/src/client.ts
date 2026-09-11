import { createCipheriv } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_CONFIG } from './config.js';

export interface Credentials {
  token: string;
  baseUrl: string;
  accountId: string;
  userId: string;
  nickname?: string;
  savedAt: string;
}

export interface WeChatMessage {
  message_id?: string;
  from_user_id: string;
  from_user_name?: string;
  to_user_id: string;
  context_token: string;
  item_list: any[];
}

export interface WeChatClientOptions {
  baseUrl?: string;
  cdnBaseUrl?: string;
  apiTimeout?: number;
  longPollTimeout?: number;
  token?: string;
  logger?: Logger;
}

export interface Logger {
  debug: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

export const createLogger = (level = 'info'): Logger => {
  const levels: Record<string, number> = { debug: 0, info: 1, warn: 2, error: 3 };
  const currentLevel = levels[level] || 1;

  return {
    debug: (...args: any[]) => currentLevel <= 0 && console.log('[wechat-clawbot][DEBUG]', ...args),
    info: (...args: any[]) => currentLevel <= 1 && console.log('[wechat-clawbot][INFO]', ...args),
    warn: (...args: any[]) => currentLevel <= 2 && console.warn('[wechat-clawbot][WARN]', ...args),
    error: (...args: any[]) => currentLevel <= 3 && console.error('[wechat-clawbot][ERROR]', ...args)
  };
};

export class WeChatClient {
  private baseUrl: string;
  private cdnBaseUrl: string;
  private apiTimeout: number;
  private longPollTimeout: number;
  public token: string | null;
  public syncBuf: string;
  public contextToken: string;
  private isRunning: boolean;
  private messageHandlers: ((msg: WeChatMessage) => Promise<void>)[];
  private errorHandlers: ((error: Error) => void)[];
  private sessionExpiredHandlers: (() => void)[];
  private logger: Logger;
  // Fixed per-client UIN (weclaw generates one per client instance, not per request)
  private wechatUIN: string;

  /** Invoked whenever the sync cursor advances, so callers can persist it */
  public onSyncBufPersist?: (buf: string) => void;

  constructor(options: WeChatClientOptions = {}) {
    this.baseUrl = options.baseUrl || DEFAULT_CONFIG.base_url;
    this.cdnBaseUrl = options.cdnBaseUrl || DEFAULT_CONFIG.cdn_base_url;
    this.apiTimeout = options.apiTimeout || DEFAULT_CONFIG.api_timeout;
    this.longPollTimeout = options.longPollTimeout || DEFAULT_CONFIG.long_poll_timeout;
    this.token = options.token || null;
    this.syncBuf = '';
    this.contextToken = '';
    this.isRunning = false;
    this.messageHandlers = [];
    this.errorHandlers = [];
    this.sessionExpiredHandlers = [];
    this.logger = options.logger || createLogger();
    this.wechatUIN = Buffer.from(String(Math.floor(Math.random() * 4294967296))).toString('base64');
  }

  private buildHeaders(tokenRequired = false): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      AuthorizationType: 'ilink_bot_token',
      'X-WECHAT-UIN': this.wechatUIN
    };

    if (tokenRequired && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request(method: string, endpoint: string, options: any = {}): Promise<any> {
    let url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
    const headers = { ...this.buildHeaders(options.tokenRequired), ...options.headers };

    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(options.timeout || this.apiTimeout)
    };

    if (options.params) {
      const urlObj = new URL(url);

      for (const [key, value] of Object.entries(options.params)) {
        urlObj.searchParams.set(key, String(value));
      }
      url = urlObj.toString();
    }

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, fetchOptions);
    const text = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const json = text ? JSON.parse(text) : {};

    if (json && typeof json === 'object') {
      const ret = parseInt(json.ret ?? json.base_info?.ret ?? json.base_response?.ret ?? 0);
      const errcode = parseInt(json.errcode ?? json.base_info?.errcode ?? json.base_response?.errcode ?? 0);

      if (ret !== 0 || errcode !== 0) {
        const errmsg = json.errmsg || json.base_info?.errmsg || json.base_response?.errmsg || 'none';
        const error = new Error(`iLink API Error: ret=${ret}, errcode=${errcode}, errmsg=${errmsg}`);

        // Attach structured fields so the poll loop can react precisely
        // (e.g. errcode=-14 usually means the sync buf expired, not the token)
        (error as any).ret = ret;
        (error as any).errcode = errcode;
        (error as any).errmsg = errmsg;
        throw error;
      }
    }

    return json;
  }

  async getQRCode(): Promise<any> {
    return this.request('GET', 'ilink/bot/get_bot_qrcode', {
      params: { bot_type: '3' },
      timeout: 15000
    });
  }

  async pollQRStatus(qrcode: string): Promise<any> {
    return this.request('GET', 'ilink/bot/get_qrcode_status', {
      params: { qrcode },
      timeout: this.longPollTimeout,
      headers: { 'iLink-App-ClientVersion': '1' }
    });
  }

  async getUpdates(syncBuf?: string): Promise<any> {
    return this.request('POST', 'ilink/bot/getupdates', {
      body: {
        base_info: { channel_version: '1.0.0' },
        get_updates_buf: syncBuf || ''
      },
      tokenRequired: true,
      timeout: this.longPollTimeout
    });
  }

  async sendMessage(toUserId: string, itemList: any[], contextToken: string): Promise<any> {
    return this.request('POST', 'ilink/bot/sendmessage', {
      body: {
        base_info: {},
        msg: {
          from_user_id: '',
          to_user_id: toUserId,
          client_id: crypto.randomUUID(),
          message_type: 2,
          message_state: 2,
          context_token: contextToken,
          item_list: itemList
        }
      },
      tokenRequired: true
    });
  }

  async getUploadUrl(params: any): Promise<any> {
    return this.request('POST', 'ilink/bot/getuploadurl', {
      body: {
        ...params,
        base_info: {}
      },
      tokenRequired: true
    });
  }

  async uploadToCdn(
    uploadFullUrl: string | undefined,
    uploadParam: string | undefined,
    fileKey: string,
    aesKeyHex: string,
    fileBuffer: Buffer
  ): Promise<string> {
    const key = Buffer.from(aesKeyHex, 'hex');
    const cipher = createCipheriv('aes-128-ecb', key, null);
    const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);

    this.logger.debug('CDN upload:', { rawSize: fileBuffer.length, encryptedSize: encrypted.length, fileKey });

    let url: string;

    if (uploadFullUrl) {
      url = uploadFullUrl;
    } else if (uploadParam) {
      url = `${this.cdnBaseUrl}/upload?encrypted_query_param=${encodeURIComponent(uploadParam)}&filekey=${encodeURIComponent(fileKey)}`;
    } else {
      throw new Error('CDN upload URL missing');
    }

    const response = await fetch(url, {
      method: 'POST',
      body: encrypted,
      headers: { 'Content-Type': 'application/octet-stream' },
      signal: AbortSignal.timeout(this.apiTimeout)
    });

    if (!response.ok) {
      const text = await response.text();

      throw new Error(`CDN upload failed: ${response.status} ${text}`);
    }

    return response.headers.get('x-encrypted-param') || '';
  }

  onMessage(handler: (msg: WeChatMessage) => Promise<void>): void {
    this.messageHandlers.push(handler);
  }

  onError(handler: (error: Error) => void): void {
    this.errorHandlers.push(handler);
  }

  onSessionExpired(handler: () => void): void {
    this.sessionExpiredHandlers.push(handler);
  }

  async emitMessage(msg: WeChatMessage): Promise<void> {
    for (const handler of this.messageHandlers) {
      await handler(msg);
    }
  }

  private emitError(error: Error): void {
    for (const handler of this.errorHandlers) {
      handler(error);
    }
  }

  private emitSessionExpired(): void {
    for (const handler of this.sessionExpiredHandlers) {
      handler();
    }
  }

  async startPolling(): Promise<void> {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    let failures = 0;
    let bufResets = 0;

    // Mirrors weclaw's monitor loop: exponential backoff capped at 60s, concurrent
    // message dispatch, and sync-buf reset recovery for errcode=-14 (a stale cursor
    // also surfaces as -14; only an empty buf with -14 means the token itself died).
    const initialBackoff = 3000;
    const maxBackoff = 60000;
    const sessionExpiredBackoff = 5000;
    const maxBufResets = 3;

    this.logger.info('Starting message polling...');

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    while (this.isRunning) {
      try {
        const result = await this.getUpdates(this.syncBuf);

        failures = 0;

        if (result.get_updates_buf && result.get_updates_buf !== this.syncBuf) {
          this.syncBuf = result.get_updates_buf;
          try {
            this.onSyncBufPersist?.(this.syncBuf);
          } catch (err) {
            this.logger.warn('Failed to persist sync buf:', err);
          }
        }

        const msgs = result.msgs || [];

        if (msgs.length > 0) {
          this.logger.info(`Received ${msgs.length} message(s)`);
        }

        // Dispatch concurrently — a slow handler must never stall the poll loop
        for (const msg of msgs) {
          if (!this.isRunning) {
            break;
          }
          void this.emitMessage(msg).catch(err => {
            this.logger.error('Error processing message:', err);
          });
        }
      } catch (error: any) {
        const errcode = Number(error?.errcode ?? 0);
        const ret = Number(error?.ret ?? 0);
        const message = String(error?.message ?? error);

        const looksLikeSessionIssue = errcode === -14 || ret === 401 || ret === 403 || message.includes('invalid token') || message.includes('session timeout');

        if (looksLikeSessionIssue) {
          // A stale cursor commonly produces errcode=-14; try dropping the buf first
          if (this.syncBuf && bufResets < maxBufResets) {
            bufResets++;
            this.logger.warn(`Session issue (errcode=${errcode}), resetting sync buf and retrying (${bufResets}/${maxBufResets})`);
            this.syncBuf = '';
            try {
              this.onSyncBufPersist?.('');
            } catch {
              // Persistence failure is non-fatal here
            }
            await sleep(sessionExpiredBackoff);
            continue;
          }

          this.logger.error('Session expired (token invalid):', message);
          this.emitSessionExpired();

          return;
        }

        if (message.includes('timeout') || error?.name === 'AbortError') {
          continue;
        }

        // Server-side errors without session semantics: retry without long backoff
        if (ret !== 0 || errcode !== 0) {
          this.logger.warn(`iLink server error (ret=${ret}, errcode=${errcode}): ${message}; retrying`);
          await sleep(1000);
          continue;
        }

        failures++;
        const backoff = Math.min(initialBackoff * 2 ** (failures - 1), maxBackoff);

        this.logger.warn(`Polling error (attempt ${failures}), retrying in ${backoff / 1000}s:`, message);
        this.emitError(error);
        await sleep(backoff);
      }
    }

    this.logger.info('Message polling stopped');
  }

  stopPolling(): void {
    this.isRunning = false;
  }

  setCredentials(credentials: Credentials): void {
    this.token = credentials.token;
  }

  getContextToken(): string {
    return this.contextToken;
  }

  setContextToken(token: string): void {
    this.contextToken = token;
  }
}

// Token Storage
export class TokenStorage {
  private dir: string;
  private fileName: string;

  constructor(dir?: string) {
    this.dir = dir || DEFAULT_CONFIG.storage_dir;
    this.fileName = 'credentials.json';
  }

  async load(): Promise<Credentials | undefined> {
    try {
      const raw = await readFile(this.filePath(), 'utf8');

      return JSON.parse(raw) as Credentials;
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return undefined;
      }
      throw err;
    }
  }

  async save(credentials: Credentials): Promise<void> {
    const { mkdir, writeFile } = await import('node:fs/promises');

    await this.ensureDir();
    await writeFile(this.filePath(), JSON.stringify(credentials, null, 2) + '\n', { mode: 0o600 });
  }

  async delete(): Promise<void> {
    const { rm } = await import('node:fs/promises');

    try {
      await rm(this.filePath(), { force: true });
    } catch {
      // Ignore errors
    }
  }

  private filePath(): string {
    return path.join(this.dir, this.fileName);
  }

  private async ensureDir(): Promise<void> {
    const { mkdir } = await import('node:fs/promises');

    await mkdir(this.dir, { recursive: true, mode: 0o700 });
  }
}

// Context Storage
export class ContextStorage {
  private dir: string;

  constructor(dir?: string) {
    this.dir = dir || DEFAULT_CONFIG.storage_dir;
  }

  async load(botId: string): Promise<{ syncBuf: string; contextToken: string }> {
    try {
      const filePath = this.filePath(botId);
      const raw = await readFile(filePath, 'utf8');

      return JSON.parse(raw);
    } catch {
      return { syncBuf: '', contextToken: '' };
    }
  }

  async save(botId: string, data: { syncBuf?: string; contextToken?: string }): Promise<void> {
    const { writeFile } = await import('node:fs/promises');

    await this.ensureDir();
    const existing = await this.load(botId);
    const updated = { ...existing, ...data };

    await writeFile(this.filePath(botId), JSON.stringify(updated, null, 2) + '\n', { mode: 0o600 });
  }

  private filePath(botId: string): string {
    const safeId = botId.replace(/[^a-zA-Z0-9_-]/g, '_');

    return path.join(this.dir, `context_${safeId}.json`);
  }

  private async ensureDir(): Promise<void> {
    const { mkdir } = await import('node:fs/promises');

    await mkdir(this.dir, { recursive: true, mode: 0o700 });
  }
}
