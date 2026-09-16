// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
import { randomUUID } from 'node:crypto';
import { logger } from '../logger.js';
import { CookieJar } from './cookie.js';
import { parseJsonResponse } from './response.js';
import type { HttpResponse } from './response.js';
import { buildPassportAidSign, normalizePassportPath, passportNoonUtcTs } from '../sign/aid-sign.js';
import {
  CREATOR_AID,
  CREATOR_ORIGIN,
  CREATOR_PASSPORT_APP_KEY,
  DEFAULT_USER_AGENT,
  DESKTOP_AID,
  DESKTOP_ORIGIN,
  DESKTOP_PASSPORT_APP_KEY
} from '../sign/constants.js';
import { randomBizTraceId, randomDesktopHex } from '../sign/sign-qs.js';

export interface DouyinHttpConfig {
  userAgent?: string;
  /** 默认请求超时毫秒；RequestInit.signal 显式传入时优先生效 */
  requestTimeoutMs?: number;
  /** 浏览器复制的 Cookie 或上一轮会话 */
  initialCookies?: string;
  msToken?: string;
  /** 默认 true：Passport 查询串自动计算 a_bogus（供上层 signPassportQuery 读取） */
  enableABogus?: boolean;
  /** 默认 true：按 path + 当日 UTC 正午 ts 自动计算 x-tt-passport-aid-sign */
  enableAutoAidSign?: boolean;
  bizTraceId?: string;
  /** Injectable HTTP transport; defaults to native fetch. */
  fetch?: typeof fetch;
}

/**
 * 抖音 HTTP 客户端（creator-web）：Cookie/UA/超时封装 + Passport 请求头 + 标准参数。
 * 仅纯 HTTP 部分，登录流程由上层组装。
 */
export class DouyinHttp {
  readonly jar: CookieJar;
  readonly enableABogus: boolean;
  readonly enableAutoAidSign: boolean;
  bizTraceId: string;
  /** 服务端注册的桌面设备身份（登录时注入；'0' 表示未注册） */
  deviceId = '0';
  installId = '0';
  guid = randomDesktopHex(32);

  private readonly requestTimeoutMs: number;
  private readonly userAgent: string;
  private readonly fetch: typeof fetch;
  private readonly verifyPortrait = `${randomUUID()}.login`;

  constructor(config: DouyinHttpConfig = {}) {
    this.fetch = config.fetch ?? globalThis.fetch;
    this.requestTimeoutMs = config.requestTimeoutMs ?? 30_000;
    if (!Number.isSafeInteger(this.requestTimeoutMs) || this.requestTimeoutMs <= 0 || this.requestTimeoutMs > 2_147_483_647) {
      throw new RangeError('requestTimeoutMs must be an integer between 1 and 2147483647');
    }
    this.jar = new CookieJar(config.initialCookies);
    this.userAgent = config.userAgent ?? DEFAULT_USER_AGENT;
    this.enableABogus = config.enableABogus ?? true;
    this.enableAutoAidSign = config.enableAutoAidSign ?? true;
    if (config.msToken !== null && config.msToken !== undefined) {
      this.jar.set('msToken', config.msToken);
    }
    this.bizTraceId = config.bizTraceId ?? this.jar.get('biz_trace_id') ?? randomBizTraceId();
    if (!this.jar.has('biz_trace_id')) {
      this.jar.set('biz_trace_id', this.bizTraceId);
    }
  }

  getCookies(): string {
    return this.jar.toHeader();
  }

  setMsToken(value: string): void {
    this.jar.set('msToken', value);
  }

  getMsToken(): string | undefined {
    return this.jar.get('msToken');
  }

  getUserAgent(): string {
    return this.userAgent;
  }

  /** 注入服务端注册的桌面设备身份（device_register 签发） */
  setDevice(device: { deviceId: string; installId: string; guid: string }): void {
    this.deviceId = device.deviceId;
    this.installId = device.installId;
    this.guid = device.guid;
  }

  hasDesktopDevice(): boolean {
    return this.deviceId !== '0' && /^\d+$/.test(this.deviceId);
  }

  /** 创作者平台标准查询参数（浏览器兼容格式） */
  buildStandardParams(): URLSearchParams {
    const params = new URLSearchParams({
      aid: '2906',
      app_name: 'aweme_creator_platform',
      device_platform: 'web',
      referer: '',
      user_agent: this.userAgent,
      cookie_enabled: 'true',
      screen_width: '1512',
      screen_height: '982',
      browser_language: 'zh-CN',
      browser_platform: 'MacIntel',
      browser_name: 'Mozilla',
      browser_version: this.userAgent.replace(/^Mozilla\//, ''),
      browser_online: 'true',
      timezone_name: 'Asia/Shanghai'
    });
    const msToken = this.getMsToken();

    if (msToken) {
      params.set('msToken', msToken);
    }

    return params;
  }

  /** Passport 接口请求头；imdesktop（桌面客户端）与 creator（创作者 web）分流 */
  passportHeaders(requestUrl?: string): Record<string, string> {
    const desktop = Boolean(requestUrl?.startsWith(DESKTOP_ORIGIN));
    const headers: Record<string, string> = {
      Accept: 'application/json, text/javascript',
      Referer: desktop ? DESKTOP_ORIGIN : `${CREATOR_ORIGIN}/creator-micro/home`
    };
    const csrf = this.jar.get('passport_csrf_token') ?? this.jar.get('passport_csrf_token_default');

    if (csrf) {
      headers['x-tt-passport-csrf-token'] = csrf;
    }
    headers['x-tt-passport-trace-id'] = this.bizTraceId;
    const aidSign = this.resolveAidSign(requestUrl, desktop);

    if (aidSign) {
      headers['x-tt-passport-aid-sign'] = aidSign;
    }
    if (desktop) {
      headers['x-tt-passport-verify-portrait'] = this.verifyPortrait;

      return headers;
    }
    const secsdk = buildSecsdkCsrfToken(this.jar.get('x-web-secsdk-uid'));

    if (secsdk) {
      headers['x-secsdk-csrf-token'] = secsdk;
    }
    headers['x-tt-passport-verify-portrait'] = this.verifyPortrait;

    return headers;
  }

  private resolveAidSign(requestUrl?: string, desktop = false): string | undefined {
    if (!this.enableAutoAidSign || !requestUrl) {
      return undefined;
    }
    try {
      const path = new URL(requestUrl).pathname;

      return buildPassportAidSign({
        aid: desktop ? DESKTOP_AID : CREATOR_AID,
        appKey: desktop ? DESKTOP_PASSPORT_APP_KEY : CREATOR_PASSPORT_APP_KEY,
        path: normalizePassportPath(path),
        ts: passportNoonUtcTs()
      });
    } catch {
      return undefined;
    }
  }

  async requestRaw(url: string, init: RequestInit = {}): Promise<HttpResponse<string>> {
    const res = await this.fetchResponse(url, init);
    const rawText = await res.text();
    const path = new URL(url, 'https://douyin.invalid').pathname;

    logger.debug(`[douyin:http] ${(init.method ?? 'GET').toUpperCase()} ${res.status} ${path}`);

    return { ok: res.ok, status: res.status, headers: res.headers, data: rawText, rawText };
  }

  async requestJson<T>(url: string, init: RequestInit = {}): Promise<HttpResponse<T>> {
    const res = await this.requestRaw(url, init);
    const data = parseJsonResponse<T>(res, url);

    return { ...res, data };
  }

  async requestBytes(url: string, init: RequestInit = {}): Promise<{ ok: boolean; status: number; headers: Headers; data: Uint8Array }> {
    const res = await this.fetchResponse(url, init);
    const data = new Uint8Array(await res.arrayBuffer());
    const path = new URL(url, 'https://douyin.invalid').pathname;

    logger.debug(`[douyin:http] ${(init.method ?? 'GET').toUpperCase()} ${res.status} ${path} (${data.byteLength} bytes)`);

    return { ok: res.ok, status: res.status, headers: res.headers, data };
  }

  private async fetchResponse(url: string, init: RequestInit): Promise<Response> {
    const host = new URL(url).hostname;
    const sessionHost = host === 'douyin.com' || host.endsWith('.douyin.com') || host === 'imapi3-normal.zijieapi.com';
    const cookie = this.jar.toHeader();
    const headers = new Headers(init.headers);

    if (!headers.has('User-Agent')) {
      headers.set('User-Agent', this.userAgent);
    }
    if (sessionHost && cookie) {
      headers.set('Cookie', cookie);
    }

    const res = await this.fetch(url, {
      ...init,
      headers,
      signal: init.signal ?? AbortSignal.timeout(this.requestTimeoutMs)
    });

    if (sessionHost) {
      this.absorbSetCookie(res.headers);
    }
    const msHeader = res.headers.get('x-ms-token');

    if (msHeader && (sessionHost || host === 'mssdk.bytedance.com')) {
      this.setMsToken(msHeader);
    }

    return res;
  }

  private absorbSetCookie(headers: Headers): void {
    const list = typeof headers.getSetCookie === 'function' ? headers.getSetCookie() : collectSetCookieFallback(headers);

    for (const line of list) {
      this.jar.mergeSetCookie(line);
    }
  }
}

function collectSetCookieFallback(headers: Headers): string[] {
  const raw = (headers as Headers & { raw?: () => Record<string, string[]> }).raw?.();

  if (!raw?.['set-cookie']) {
    const single = headers.get('set-cookie');

    return single ? [single] : [];
  }

  return raw['set-cookie'];
}

/** 常见形态：`000100000001` + `x-web-secsdk-uid` 去连字符 */
function buildSecsdkCsrfToken(webSecsdkUid?: string): string | undefined {
  if (!webSecsdkUid) {
    return undefined;
  }

  return `000100000001${webSecsdkUid.replace(/-/g, '')}`;
}
