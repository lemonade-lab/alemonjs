// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
import { createHash, randomBytes } from 'node:crypto';
import { generateABogus, generateJumpbyteABogus } from './a-bogus.js';
import type { ABogusOptions, BdmsPreset } from './a-bogus.js';
import { passportNoonUtcTs } from './aid-sign.js';
import { CREATOR_AID, CREATOR_ORIGIN, CREATOR_PASSPORT_APP_KEY, DESKTOP_AID, DESKTOP_APP_VERSION, DESKTOP_ORIGIN, PASSPORT_SDK_META } from './constants.js';

export interface PassportSignQsInput {
  /** 查询参数（不含 sign / qs / msToken / a_bogus） */
  query: Record<string, string>;
  /** POST body 字段；使用解码后的值（与 SDK 内存对象一致，非 URL 编码串） */
  body?: Record<string, string>;
  appKey?: string;
}

export interface PassportSignQsOutput {
  sign: string;
  qs: string;
}

function sortedParamString(
  obj: Record<string, string>,
  keepFirstN?: number
): {
  str: string;
  keys: string[];
} {
  let keys = Object.keys(obj).sort();

  if (keepFirstN !== undefined && keepFirstN >= 0) {
    keys = keys.slice(0, keepFirstN);
  }
  const str = keys
    .map(k => {
      const v = obj[k];
      const val = typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v);

      return `${k}=${val}`;
    })
    .join('&');

  return { str, keys };
}

/** qs：对「排序后前 10 个 query 键名」逗号拼接，再 UTF-8 + 每字节 XOR 5 → hex（无补零） */
function encodeQsKeyNames(keyNames: string[]): string {
  const input = keyNames.join(',');
  const out: string[] = [];

  for (let i = 0; i < input.length; i++) {
    const cp = input.charCodeAt(i);
    const bytes: number[] = [];

    if (cp >= 0 && cp <= 0x7f) {
      bytes.push(cp);
    } else if (cp >= 0x80 && cp <= 0x7ff) {
      bytes.push(0xc0 | (31 & (cp >> 6)), 0x80 | (63 & cp));
    } else if ((cp >= 0x800 && cp <= 0xd7ff) || (cp >= 0xe000 && cp <= 0xffff)) {
      bytes.push(0xe0 | (15 & (cp >> 12)), 0x80 | (63 & (cp >> 6)), 0x80 | (63 & cp));
    }
    for (const b of bytes) {
      out.push((5 ^ b).toString(16));
    }
  }

  return out.join('');
}

/**
 * 复现 tt-account-sdk 请求拦截器 `d(query, body, appKey)`：
 * sign = sha256(排序 query 前 10 项 & body & app_key)
 */
export function buildPassportSignQs(input: PassportSignQsInput): PassportSignQsOutput {
  const appKey = input.appKey ?? CREATOR_PASSPORT_APP_KEY;
  const body = input.body ?? {};
  const { str: queryStr, keys } = sortedParamString(input.query, 10);
  const { str: bodyStr } = sortedParamString(body);
  const payload = `${queryStr}&${bodyStr}&app_key=${appKey}`;
  const sign = createHash('sha256').update(payload, 'utf8').digest('hex');
  const qs = encodeQsKeyNames(keys);

  return { sign, qs };
}

/** 将 application/x-www-form-urlencoded 解析为签名用的 body 对象（值已 decode） */
export function parseFormBodyForSign(body: string): Record<string, string> {
  const out: Record<string, string> = {};

  if (!body) {
    return out;
  }
  for (const part of body.split('&')) {
    const eq = part.indexOf('=');

    if (eq === -1) {
      out[decodeURIComponent(part)] = '';
    } else {
      out[decodeURIComponent(part.slice(0, eq))] = decodeURIComponent(part.slice(eq + 1));
    }
  }

  return out;
}

export interface PassportQueryOptions {
  /** Unix 秒；默认 `passportNoonUtcTs()` */
  ts?: string;
  bizTraceId?: string;
  accountSdkSourceInfo?: string;
  isNewLogin?: string;
  next?: string;
  extra?: Record<string, string>;
}

export interface SignedPassportQuery {
  query: Record<string, string>;
  search: string;
}

export function randomBizTraceId(): string {
  return randomBytes(4).toString('hex');
}

/** 不含 sign/qs/msToken/a_bogus 的 Passport 基础查询对象 */
export function buildPassportBaseQuery(opts: PassportQueryOptions = {}): Record<string, string> {
  const ts = opts.ts ?? passportNoonUtcTs();
  const bizTraceId = opts.bizTraceId ?? randomBizTraceId();
  const query: Record<string, string> = {
    ...PASSPORT_SDK_META,
    aid: CREATOR_AID,
    ts,
    biz_trace_id: bizTraceId,
    is_new_login: opts.isNewLogin ?? '1',
    account_sdk_source_info: opts.accountSdkSourceInfo ?? '',
    ...opts.extra
  };

  if (opts.next) {
    query.next = opts.next;
  }

  return query;
}

export interface SignPassportExtras {
  /** Passport SDK appKey */
  appKey?: string;
  msToken?: string;
  /** 手动覆盖时跳过本地计算 */
  aBogus?: string;
  userAgent?: string;
  enableABogus?: boolean;
  /** POST 的 on-wire form（`encodeFormBody`）；GET 传 '' */
  bodyWire?: string;
  screenFingerprint?: string;
  bdmsPreset?: BdmsPreset;
  aBogusVariant?: 'creator' | 'jumpbyte-desktop';
}

export function signPassportQuery(baseQuery: Record<string, string>, body: Record<string, string> = {}, extras?: SignPassportExtras): SignedPassportQuery {
  const signInput: PassportSignQsInput = {
    query: baseQuery,
    body
  };

  if (extras?.appKey) {
    signInput.appKey = extras.appKey;
  }
  const { sign, qs } = buildPassportSignQs(signInput);
  const query: Record<string, string> = {
    ...baseQuery,
    sign,
    qs
  };

  if (extras?.msToken) {
    query.msToken = extras.msToken;
  }

  const manualAbogus = extras?.aBogus;
  const compute = !manualAbogus && extras?.enableABogus !== false && Boolean(extras?.userAgent);

  if (manualAbogus) {
    query.a_bogus = manualAbogus;
  } else if (compute) {
    const queryForAbogus = new URLSearchParams(query).toString();
    const abOpts: ABogusOptions = {
      userAgent: extras.userAgent,
      query: queryForAbogus,
      body: extras?.bodyWire ?? ''
    };

    if (extras?.screenFingerprint) {
      abOpts.screenFingerprint = extras.screenFingerprint;
    }
    if (extras?.bdmsPreset) {
      abOpts.bdmsPreset = extras.bdmsPreset;
    }
    query.a_bogus =
      extras?.aBogusVariant === 'jumpbyte-desktop'
        ? generateJumpbyteABogus({
            userAgent: abOpts.userAgent,
            query: abOpts.query,
            body: abOpts.body ?? ''
          })
        : generateABogus(abOpts);
  }

  const search = new URLSearchParams(query).toString();

  return { query, search };
}

export function encodeFormBody(body: Record<string, string>): string {
  return Object.keys(body)
    .map(key => {
      const value = body[key] ?? '';

      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join('&');
}

export function passportUrl(path: string, search: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;

  return `${CREATOR_ORIGIN}${normalized}?${search}`;
}

export function desktopPassportUrl(path: string, search: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;

  return `${DESKTOP_ORIGIN}${normalized}?${search}`;
}

export interface DesktopPassportQueryOptions {
  deviceId: string;
  installId: string;
  accountSdkSourceInfo?: string;
  bizTraceId?: string;
  next?: string;
  /** need_logo / need_short_url / fp 等 login scope 追加项 */
  extra?: Record<string, string>;
}

/** 桌面 normal SDK（2.4.12）Passport 基础查询，字段顺序对齐 douyin-im（a_bogus 对顺序敏感） */
export function buildDesktopPassportBaseQuery(opts: DesktopPassportQueryOptions): Record<string, string> {
  return {
    passport_jssdk_version: '2.4.12',
    passport_jssdk_type: 'normal',
    is_from_ttaccountsdk: '1',
    aid: DESKTOP_AID,
    language: 'zh',
    ts: passportNoonUtcTs(),
    ...(opts.next ? { next: opts.next } : {}),
    ...(opts.extra ?? {}),
    is_new_login: '1',
    is_from_iesaccountsaas: '1',
    account_sdk_source: 'web',
    account_sdk_source_info: opts.accountSdkSourceInfo ?? '',
    p_js_v: '2.4.12',
    p_js_t: 'pro',
    p_zt: '3.3.5',
    p_ver: '1.0.29',
    request_host: 'file://',
    p_bd: '1.0.1.7',
    biz_trace_id: opts.bizTraceId ?? randomBizTraceId(),
    device_id: opts.deviceId,
    iid: opts.installId,
    version_code: DESKTOP_APP_VERSION,
    device_platform: 'PC'
  };
}

/** jumpbyte desktop canonical 参数顺序（form/query 编码用） */
const DESKTOP_PARAM_ORDER: Readonly<Record<string, number>> = {
  passport_jssdk_version: 0,
  passport_jssdk_type: 1,
  is_from_ttaccountsdk: 2,
  aid: 3,
  language: 4,
  account_app_language: 5,
  ts: 6,
  next: 7,
  need_logo: 8,
  need_short_url: 9,
  is_new_login: 10,
  is_from_iesaccountsaas: 11,
  account_sdk_source: 12,
  account_sdk_source_info: 13,
  p_js_v: 14,
  p_js_t: 15,
  p_zt: 16,
  p_ver: 17,
  request_host: 18,
  p_bd: 19,
  biz_trace_id: 20,
  new_authn_sdk_version: 21,
  device_id: 22,
  iid: 23,
  version_code: 24,
  device_platform: 25,
  sign: 100,
  qs: 101,
  msToken: 102,
  a_bogus: 103
};

/** desktop 端 Passport 参数编码：按 jumpbyte canonical 顺序输出 form/query 串 */
export function encodeDesktopPassportParams(params: Record<string, string>): string {
  return Object.keys(params)
    .sort((left, right) => {
      const leftOrder = DESKTOP_PARAM_ORDER[left];
      const rightOrder = DESKTOP_PARAM_ORDER[right];

      if (leftOrder !== null && leftOrder !== undefined && rightOrder !== null && rightOrder !== undefined) {
        return leftOrder - rightOrder;
      }
      if (leftOrder !== null && leftOrder !== undefined) {
        return -1;
      }
      if (rightOrder !== null && rightOrder !== undefined) {
        return 1;
      }

      return left < right ? -1 : left > right ? 1 : 0;
    })
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key] ?? '')}`)
    .join('&');
}

const RANDOM_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** 128 位随机 msToken（desktop lite 接口用） */
export function randomMsToken128(length = 128): string {
  return [...randomBytes(length)].map(value => RANDOM_ALPHABET[value & 63]).join('');
}

/** 随机 hex（desktop biz_trace_id/device_id 用） */
export function randomDesktopHex(length: number): string {
  return [...randomMsToken128(length)].map(value => '0123456789abcdef'[value.charCodeAt(0) & 15]).join('');
}
