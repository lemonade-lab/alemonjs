// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
import type { AccountRecord } from './types.js';

export interface LocalSessionHealth {
  /** sid_guard 距过期剩余秒数；无法解析时 undefined */
  remainingSec?: number;
  /** 是否已过期 */
  expired: boolean;
}

/**
 * 解析 `sid_guard` cookie：`<sid>|<issued_unix>|<ttl_sec>|<expire_date>`
 * 返回距过期剩余秒数。
 */
export function parseSidGuardTtl(cookies: string): number | undefined {
  const match = cookies.match(/sid_guard=([^;]+)/);

  if (!match) {
    return undefined;
  }
  const decoded = decodeURIComponent(match[1]);
  const parts = decoded.split('|');

  if (parts.length < 3) {
    return undefined;
  }
  const issuedAt = parseInt(parts[1], 10);
  const ttlSec = parseInt(parts[2], 10);

  if (isNaN(issuedAt) || isNaN(ttlSec)) {
    return undefined;
  }
  const expiresAt = issuedAt + ttlSec;

  return expiresAt - Math.floor(Date.now() / 1000);
}

/** 检查 Session 健康状态（不走网络，纯本地解析） */
export function checkSessionHealth(account: AccountRecord): LocalSessionHealth {
  const remaining = parseSidGuardTtl(account.session.cookies);
  const expired = remaining !== undefined && remaining <= 0;
  const result: LocalSessionHealth = { expired };

  if (remaining !== undefined) {
    result.remainingSec = remaining;
  }

  return result;
}
