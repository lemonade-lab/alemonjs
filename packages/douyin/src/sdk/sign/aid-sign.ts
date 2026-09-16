// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
import { createHmac } from 'node:crypto';
import { CREATOR_PASSPORT_APP_KEY } from './constants.js';

function hmacSha256Hex(key: Uint8Array, message: Uint8Array): string {
  return createHmac('sha256', Buffer.from(key)).update(Buffer.from(message)).digest('hex');
}

function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.length % 2 === 1 ? `0${hex}` : hex;

  return Uint8Array.from(Buffer.from(normalized, 'hex'));
}

/** 272.js `Nl`：首包 HMAC 后按轮扩展为 32 字节（内层 `e` 固定为首包 hex） */
function derivePassportSignKey(password: Uint8Array, salt: Uint8Array, extra: Uint8Array, length = 32): Uint8Array {
  let pw = password;

  if (pw.length === 0) {
    pw = new Uint8Array(32);
  }
  const firstHex = hmacSha256Hex(pw, salt);
  const fixedKey = hexToBytes(firstHex);
  let rollingHex = firstHex;
  const out: number[] = [];

  for (let round = 1; out.length < length; round += 1) {
    const msg = Uint8Array.from([...hexToBytes(rollingHex), ...extra, round]);

    rollingHex = hmacSha256Hex(fixedKey, msg);
    out.push(...hexToBytes(rollingHex));
  }

  return Uint8Array.from(out.slice(0, length));
}

export interface PassportAidSignInput {
  aid: string;
  /** 不含 query 的 path，如 `/passport/web/get_qrcode/` */
  path: string;
  /** 与查询串 `ts` 一致，默认 `passportNoonUtcTs()` */
  ts?: string;
  appKey?: string;
}

/**
 * `x-tt-passport-aid-sign`（64 hex HMAC-SHA256）
 * 消息：`aid={aid}&path={path}&ts={ts}`
 */
export function buildPassportAidSign(input: PassportAidSignInput): string {
  const appKey = input.appKey ?? CREATOR_PASSPORT_APP_KEY;
  const ts = input.ts ?? '';
  const enc = new TextEncoder();
  const key = derivePassportSignKey(enc.encode(ts), enc.encode(appKey), new Uint8Array(0), 32);
  const message = `aid=${input.aid}&path=${input.path}&ts=${ts}`;

  return hmacSha256Hex(key, enc.encode(message));
}

/** SSO 域名下给 path 加 `/passport/sso` 前缀；创作者站通常原样返回 */
export function normalizePassportPath(path: string, hostname = 'creator.douyin.com'): string {
  if (path.startsWith('/passport') || hostname.includes('sso')) {
    return path;
  }

  return `/passport/sso${path}`;
}

/** Passport 查询串 `ts`：当日 UTC 12:00:00 的 Unix 秒（与 tt-account-sdk aid-sign 中间件一致） */
export function passportNoonUtcTs(date: Date = new Date()): string {
  const noon = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0, 0);

  return String(Math.floor(noon / 1000));
}
