// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
import { checkSessionHealth } from './session-health.js';
import type { AccountRecord } from './types.js';

export type RestoreOutcome = 'ok' | 'expired' | 'missing';

/**
 * tryRestoreSession 的本地纯逻辑段：无账号 / cookies 为空 → `missing`；
 * sid_guard 本地已过期 → `expired`；返回 undefined 表示本地健康，
 * 是否真正可用需上层构建 client 后走网络验证确认（依赖层留待后续任务）。
 */
export function evaluateLocalRestore(account: AccountRecord | undefined): RestoreOutcome | undefined {
  if (!account?.session.cookies?.trim()) {
    return 'missing';
  }
  if (checkSessionHealth(account).expired) {
    return 'expired';
  }

  return undefined;
}
