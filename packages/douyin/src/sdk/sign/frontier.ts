// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
import { createHash } from 'node:crypto';
import { generateABogus, DEFAULT_SCREEN_FINGERPRINT } from './a-bogus.js';

/** cmd=100 等需 WS 帧签名的命令 */
export const WS_SIGN_CMDS = new Set([100, 609, 610, 611]);

export interface FrontierSignOptions {
  userAgent?: string;
  screenFingerprint?: string;
}

/**
 * 417.js SecurityPlugin.frontierSign：
 * 1. X-MS-STUB = MD5(serialize(request))
 * 2. byted_acrawler.frontierSign({ X-MS-STUB }) → { X-Bogus }
 */
export function buildFrontierSignHeaders(payload: Uint8Array, opts: FrontierSignOptions = {}): { key: string; value: string }[] {
  const stub = createHash('md5').update(payload).digest('hex');
  const headers: { key: string; value: string }[] = [{ key: 'X-MS-STUB', value: stub }];

  const userAgent = opts.userAgent ?? 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36';

  try {
    const xBogus = generateABogus({
      userAgent,
      query: stub,
      body: '',
      screenFingerprint: opts.screenFingerprint ?? DEFAULT_SCREEN_FINGERPRINT,
      bdmsPreset: '1.0.1.16'
    });

    if (xBogus) {
      headers.push({ key: 'X-Bogus', value: xBogus });
    }
  } catch {
    // acrawler 不可用时仅 X-MS-STUB（417.js 同样 fallback）
  }

  return headers;
}
