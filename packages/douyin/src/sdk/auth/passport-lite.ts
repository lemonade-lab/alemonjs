// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
/**
 * desktop lite Passport 传输层（imdesktop 域 + jumpbyte a_bogus 签名）。
 * 供扫码 MFA（qr.ts）与登录安全验证（verification.ts）共用。
 */
import { generateJumpbyteABogus } from '../sign/a-bogus.js';
import { encodeDesktopPassportParams, randomDesktopHex, randomMsToken128 } from '../sign/sign-qs.js';
import type { DouyinHttp } from '../http/client.js';
import type { QrMfaResponse } from './types.js';

export const DESKTOP_LITE_AID = '339757';

/** 抖音聊天桌面客户端版本号（对齐 douyin-im 修复发送限速提交 e767ef72 的取值） */
export const DESKTOP_APP_VERSION = '1.2.1';

/** 设备 ID 兜底：进程级随机 hex。登录时若已注册桌面设备则优先用注册 DID */
const DESKTOP_LITE_DEVICE_ID = randomDesktopHex(16);

export const DESKTOP_LITE_BASE_QUERY = (deviceId?: string): Record<string, string> => ({
  passport_jssdk_version: '5.1.2',
  passport_jssdk_type: 'lite',
  is_from_ttaccountsdk: '1',
  aid: DESKTOP_LITE_AID,
  language: 'zh',
  account_app_language: 'zh',
  is_new_login: '1',
  is_from_iesaccountsaas: '1',
  biz_trace_id: randomDesktopHex(8),
  new_authn_sdk_version: '1.0.0.421-web',
  device_id: deviceId ?? DESKTOP_LITE_DEVICE_ID,
  iid: '0',
  version_code: DESKTOP_APP_VERSION,
  device_platform: 'PC'
});

/** desktop lite Passport 表单 POST（imdesktop 域 + jumpbyte a_bogus） */
export async function desktopLitePassportFormPost(http: DouyinHttp, path: string, body: Record<string, string>): Promise<QrMfaResponse> {
  const query = { ...DESKTOP_LITE_BASE_QUERY(http.hasDesktopDevice() ? http.deviceId : undefined), msToken: randomMsToken128() };
  const bodyWire = encodeDesktopPassportParams(body);
  const queryWire = encodeDesktopPassportParams(query);
  const aBogus = generateJumpbyteABogus({
    userAgent: http.getUserAgent(),
    query: queryWire,
    body: bodyWire
  });
  const url = `https://imdesktop.douyin.com${path}?${queryWire}&a_bogus=${encodeURIComponent(aBogus)}`;
  const res = await http.requestJson<QrMfaResponse>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: 'https://imdesktop.douyin.com'
    },
    body: bodyWire
  });

  if (!res.ok) {
    throw new Error(`${path} failed: HTTP ${res.status} ${res.rawText.slice(0, 200)}`);
  }

  return res.data;
}
