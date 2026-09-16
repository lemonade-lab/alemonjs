// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
import { setTimeout as delay } from 'node:timers/promises';
import { DEFAULT_BROWSER_INFO, encodeBrowserInfo } from '../sign/browser-info.js';
import { mixModeEncode } from '../sign/mix-mode.js';
import { DESKTOP_PASSPORT_APP_KEY } from '../sign/constants.js';
import { buildDesktopPassportBaseQuery, encodeFormBody, desktopPassportUrl, signPassportQuery, type SignPassportExtras } from '../sign/sign-qs.js';
import type { DouyinHttp } from '../http/client.js';
import { DESKTOP_LITE_AID, desktopLitePassportFormPost } from './passport-lite.js';
import { parseVerificationDecision, runBrowserVerification, stringifyVerificationFields } from './verification.js';
import type {
  CheckQrconnectData,
  CheckQrconnectResponse,
  GetQrcodeResponse,
  QrCodeInfo,
  QrLoginOptions,
  QrMfaChallenge,
  QrMfaResponse,
  QrSession,
  QrUserData,
  QrVerifyWay
} from './types.js';

export const QR_POLL_INTERVAL_MS = 1100;

export const QR_DEFAULT_BODY = {
  need_logo: 'false',
  need_short_url: 'false',
  is_frontier: 'true',
  is_new_login: '1',
  next: 'https://www.douyin.com'
} as const;

/** GET /passport/web/get_qrcode/（imdesktop 桌面客户端流程），返回二维码 token 与 base64 图片 */
export async function getQrcode(http: DouyinHttp): Promise<QrCodeInfo> {
  const baseQuery = buildDesktopPassportBaseQuery({
    deviceId: http.deviceId,
    installId: http.installId,
    accountSdkSourceInfo: resolveAccountSdkSourceInfo(http),
    bizTraceId: http.bizTraceId,
    next: QR_DEFAULT_BODY.next,
    extra: { need_logo: 'false', need_short_url: 'false' }
  });
  const { search } = signPassportQuery(baseQuery, {}, signExtras(http));
  const url = desktopPassportUrl('/passport/web/get_qrcode/', search);
  const res = await http.requestJson<GetQrcodeResponse>(url, {
    method: 'GET',
    headers: http.passportHeaders(url)
  });

  if (!res.ok) {
    throw new Error(`get_qrcode failed: HTTP ${res.status} ${res.rawText.slice(0, 200)}`);
  }
  const d = res.data.data;

  if (d.error_code !== 0 || !d.qrcode) {
    throw new Error(`get_qrcode error_code=${d.error_code}`);
  }
  const info: QrCodeInfo = { token: d.token, qrcodeBase64: d.qrcode, expireTime: d.expire_time };

  if (d.qrcode_index_url) {
    info.qrcodeIndexUrl = d.qrcode_index_url;
  }

  return info;
}

/** POST /passport/web/check_qrconnect/（imdesktop 域），返回当前扫码状态；options.fp 用于安全验证后回填 */
export async function checkQrconnect(
  http: DouyinHttp,
  token: string,
  bodyOverrides?: Partial<Record<keyof typeof QR_DEFAULT_BODY, string>>,
  options?: { fp?: string }
): Promise<CheckQrconnectData> {
  const body: Record<string, string> = { ...QR_DEFAULT_BODY, token, ...bodyOverrides };
  const baseQuery = buildDesktopPassportBaseQuery({
    deviceId: http.deviceId,
    installId: http.installId,
    accountSdkSourceInfo: resolveAccountSdkSourceInfo(http),
    bizTraceId: http.bizTraceId,
    extra: options?.fp ? { fp: options.fp } : undefined
  });
  const bodyWire = encodeFormBody(body);
  const { search } = signPassportQuery(baseQuery, body, signExtras(http, bodyWire));
  const url = desktopPassportUrl('/passport/web/check_qrconnect/', search);
  const res = await http.requestJson<CheckQrconnectResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...http.passportHeaders(url) },
    body: bodyWire
  });

  if (!res.ok) {
    throw new Error(`check_qrconnect failed: HTTP ${res.status} ${res.rawText.slice(0, 200)}`);
  }

  return res.data.data;
}

/** 扫码登录：取码 → 轮询直至 confirmed / expired / 超时 */
export async function loginByQrcode(http: DouyinHttp, options: QrLoginOptions = {}): Promise<QrSession> {
  const qr = await getQrcode(http);

  return pollQrConfirm(http, qr.token, options);
}

/** 已取码后的轮询：处理扫码状态与短信二次验证，直至 confirmed/expired/超时 */
export async function pollQrConfirm(http: DouyinHttp, token: string, options: QrLoginOptions = {}): Promise<QrSession> {
  const pollMs = options.pollIntervalMs ?? QR_POLL_INTERVAL_MS;
  const timeoutMs = options.timeoutMs ?? 120_000;
  let deadline = Date.now() + timeoutMs;
  let last: CheckQrconnectData | undefined;
  let mfaDone = false;
  let notifiedStatus: string | undefined;
  let extraBody: Record<string, string> = {};
  let verifyCount = 0;
  let fp: string | undefined;

  while (Date.now() < deadline) {
    options.signal?.throwIfAborted();
    try {
      last = await checkQrconnect(http, token, extraBody, fp ? { fp } : undefined);
    } catch {
      await delay(pollMs, undefined, { signal: options.signal });
      continue;
    }

    options.signal?.throwIfAborted();
    // 验证中心决策：需在本地浏览器页完成官方安全验证（滑块/短信/扫码等），
    // 完成后携带结果字段重试 check_qrconnect —— 提升登录态可信度（根因 7523 限速）
    const decision = verifyCount < 3 ? parseVerificationDecision(last) : undefined;

    if (decision) {
      verifyCount += 1;
      options.onStatus?.('verifying');
      const outcome = await runBrowserVerification(http, decision, { onUrl: options.onVerifyUrl, signal: options.signal });

      extraBody = { ...extraBody, ...stringifyVerificationFields(outcome.fields) };
      fp = outcome.fp ?? fp;
      options.onStatus?.('verified');
      deadline = Date.now() + timeoutMs;
      continue;
    }

    // 短信二次验证：按 verify_ways 优先级选择方式 → 验证通过后带 biz_params 继续轮询
    if (!mfaDone && (last.account_flow === 'verify' || (last.biz_params !== null && last.biz_params !== undefined))) {
      options.onStatus?.('verifying');
      const challenge: QrMfaChallenge = {
        encrypt_uid: last.encrypt_uid,
        biz_params: last.biz_params,
        common_params: last.common_params
      };
      const way = selectVerifyWay(last);

      if (!way?.verify_way) {
        const list = (last.verify_ways ?? [])
          .map(w => w.verify_way)
          .filter(Boolean)
          .join(', ');

        throw new Error(`无可支持的验证方式（服务端可选：${list || '无'}）；请在抖音 App 完成该次身份验证后重试`);
      }
      if (way.verify_way === 'assist_mobile_up_sms_verify') {
        // 上行短信：用安全手机发指定短信，无需输入验证码
        await upSmsMfaFlow(http, challenge, way, options.onStatus);
      } else if (way.verify_way === 'pwd_verify') {
        // 登录密码验证：无需发码，直接提交密码（POST /passport/web/account/verify/）
        if (!options.onMfa) {
          throw new Error('登录触发密码二次验证，但未提供 onMfa 回调');
        }
        const password = await options.onMfa({ kind: 'password' });

        if (!password) {
          throw new Error('密码二次验证未收到输入');
        }
        const validated = await validateQrPassword(http, challenge, password);

        if (!validated.data.ticket) {
          throw new Error(`扫码密码验证失败: ${validated.data.error_code ?? '-'} ${validated.data.description ?? validated.message ?? ''}`);
        }
        options.onStatus?.('密码验证通过');
      } else {
        if (!options.onMfa) {
          throw new Error('登录触发短信二次验证，但未提供 onMfa 回调');
        }
        // 依次尝试发码：选中的方式 → 辅助手机收码（绑定手机缺失/被拒时兜底）
        const tryWays = way.verify_way === 'mobile_sms_verify' ? [way.verify_way, 'assist_mobile_sms_verify'] : [way.verify_way];
        let sent: QrMfaResponse | undefined;
        let usedWay: string | undefined;

        for (const candidate of tryWays) {
          const res = await sendQrMfaCode(http, challenge, candidate);

          if (res.message === 'success') {
            sent = res;
            usedWay = candidate;
            break;
          }
          sent = res;
        }
        if (!sent?.message || sent.message !== 'success' || !usedWay) {
          // 发码被拒：优先回退上行短信验证
          const up = (last.verify_ways ?? []).find(w => w.verify_way === 'assist_mobile_up_sms_verify');

          if (up?.verify_way) {
            options.onStatus?.(`发码被拒（${sent?.message ?? 'unknown'}${sent?.data.description ? `: ${sent.data.description}` : ''}），改用上行短信验证`);
            await upSmsMfaFlow(http, challenge, up, options.onStatus);
          } else {
            throw new Error(`发送短信验证码失败: ${sent?.message ?? 'unknown'}${sent?.data.description ? ` - ${sent.data.description}` : ''}`);
          }
        } else {
          if (usedWay !== way.verify_way) {
            options.onStatus?.('已改用辅助手机接收验证码');
          }
          const maskedMobile = sent.data.mobile ?? way.mobile;
          const code = await options.onMfa({ maskedMobile: maskedMobile !== null && maskedMobile !== undefined ? String(maskedMobile) : undefined });
          const validated = await validateQrMfaCode(http, challenge, usedWay, code);

          if (!validated.data.ticket) {
            throw new Error(`扫码短信验证失败: ${validated.data.error_code ?? '-'} ${validated.data.description ?? validated.message ?? ''}`);
          }
          options.onStatus?.('verified');
        }
      }
      extraBody = pickQrBizParams(last.biz_params);
      mfaDone = true;
      continue;
    }

    const status = last.status;

    // 同一状态只回调一次（轮询期间 scanned 会重复出现）
    if (status && status !== notifiedStatus) {
      notifiedStatus = status;
      options.onStatus?.(status);
    }
    if (status === 'confirmed') {
      return sessionFromConfirmed(http, token, last.user_data);
    }
    if (status === 'expired') {
      throw new Error('QR code expired');
    }
    await delay(pollMs, undefined, { signal: options.signal });
  }

  throw new Error(`QR login timeout after ${timeoutMs}ms; last=${last?.status ?? 'none'}`);
}

/** 验证方式优先级：安全手机短信 > 绑定手机短信 > 上行短信（用安全手机发短信）> 登录密码 */
const VERIFY_WAY_PRIORITY = ['assist_mobile_sms_verify', 'mobile_sms_verify', 'assist_mobile_up_sms_verify', 'pwd_verify'] as const;

/** 从 check_qrconnect 响应里按优先级挑选可用的验证方式 */
function selectVerifyWay(data: CheckQrconnectData): QrVerifyWay | undefined {
  const ways = data.verify_ways ?? [];

  return VERIFY_WAY_PRIORITY.map(name => ways.find(way => way.verify_way === name)).find(Boolean);
}

/** 上行短信验证：用安全手机编辑指定短信发送到服务端号码，然后轮询 validate_code 等确认 */
async function upSmsMfaFlow(http: DouyinHttp, challenge: QrMfaChallenge, way: QrVerifyWay, onStatus?: (status: string) => void): Promise<void> {
  const content = way.sms_content || 'YZ';

  onStatus?.(`请用安全手机（${way.mobile ?? ''}）编辑短信"${content}"发送到 ${way.channel_mobile ?? ''}`);
  const deadline = Date.now() + 180_000;
  let last: QrMfaResponse | undefined;

  while (Date.now() < deadline) {
    await sleep(3000);
    try {
      last = await validateQrMfaCode(http, challenge, way.verify_way ?? 'assist_mobile_up_sms_verify');
    } catch {
      continue;
    }
    if (last.data.ticket) {
      onStatus?.('短信验证通过');

      return;
    }
  }
  throw new Error(`上行短信验证超时: ${last?.data.error_code ?? '-'} ${last?.data.description ?? ''}`);
}

/** 扫码登录触发短信 MFA：发送验证码（jumpbyte desktop lite Passport 流程） */
export async function sendQrMfaCode(http: DouyinHttp, challenge: QrMfaChallenge, verifyWay: string): Promise<QrMfaResponse> {
  return await desktopLitePassportFormPost(http, '/passport/web/send_code/', qrMfaBody(challenge, verifyWay, { is6Digits: '1' }));
}

/** 校验扫码登录 MFA 短信验证码（上行短信流程不传 code） */
export async function validateQrMfaCode(http: DouyinHttp, challenge: QrMfaChallenge, verifyWay: string, code?: string): Promise<QrMfaResponse> {
  // 3737 桌面场景用 mixModeEncode，363c web 场景用 codeEncrypt
  const encoded = code === null || code === undefined ? undefined : verifyWay === 'mobile_sms_verify' ? mixModeEncode(code) : codeEncrypt(code);

  return await desktopLitePassportFormPost(
    http,
    '/passport/web/validate_code/',
    qrMfaBody(challenge, verifyWay, encoded !== null && encoded !== undefined ? { code: encoded } : {})
  );
}

/**
 * 登录密码二次验证（pwd_verify，逆向自 second-verification-web.js）：
 * POST /passport/web/account/verify/，password 字段 codeEncrypt（Xor5+hex）编码 + mix_mode=1，
 * 无 type/send_code 步骤，成功返回 data.ticket。
 */
export async function validateQrPassword(http: DouyinHttp, challenge: QrMfaChallenge, password: string): Promise<QrMfaResponse> {
  return await desktopLitePassportFormPost(http, '/passport/web/account/verify/', qrMfaBody(challenge, 'pwd_verify', { password: codeEncrypt(password) }));
}

/** code_encrypt：UTF-8 每字节 ^5 后的两位 hex（363c 场景配套） */
function codeEncrypt(s: string): string {
  const hex = '0123456789abcdef';
  let out = '';

  for (const ch of s) {
    const c = ch.codePointAt(0) ?? 0;
    const bytes =
      c <= 0x7f
        ? [c]
        : c <= 0x7ff
        ? [0xc0 | ((c >> 6) & 0x1f), 0x80 | (c & 0x3f)]
        : c <= 0xffff
        ? [0xe0 | ((c >> 12) & 0x0f), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f)]
        : [];

    for (const b of bytes) {
      out += hex[(b ^ 5) >> 4] + hex[(b ^ 5) & 15];
    }
  }

  return out;
}

function qrMfaBody(challenge: QrMfaChallenge, verifyWay: string, extra: Record<string, string>): Record<string, string> {
  const biz = challenge.biz_params ?? {};
  const common = challenge.common_params ?? {};
  const value = (source: Record<string, unknown>, key: string, fallback = ''): string => {
    const candidate = source[key];

    return candidate === null || candidate === undefined || candidate === '' ? fallback : String(candidate);
  };

  return {
    mix_mode: '1',
    // 绑定手机短信走桌面场景 3737；辅助手机/上行短信走 web 场景 363c；密码验证无 type 字段
    ...(verifyWay === 'pwd_verify' ? {} : { type: verifyWay === 'mobile_sms_verify' ? '3737' : '363c' }),
    encrypt_uid: challenge.encrypt_uid ?? '',
    verify_ticket: '',
    copywriting_key: value(common, 'copywriting_key', 'qr_connect'),
    ies_safety_diversion_tag: value(common, 'ies_safety_diversion_tag', 'mfa'),
    new_verify_flow: value(common, 'new_verify_flow'),
    std_verify_flow_id: value(biz, 'std_verify_flow_id', value(common, 'std_verify_flow_id')),
    std_verify_scene: value(biz, 'std_verify_scene', 'account_login'),
    std_verify_template: value(biz, 'std_verify_template', 'ato'),
    std_verify_token: value(biz, 'std_verify_token', value(common, 'std_verify_token')),
    std_verify_type: value(biz, 'std_verify_type', 'MFA'),
    std_verify_way: verifyWay,
    ...extra,
    aid: DESKTOP_LITE_AID,
    new_authn_sdk_version: '1.0.0.421-web'
  };
}

const QR_BIZ_PARAM_KEYS = [
  'passport_mfa_retry_tag',
  'std_verify_flow_id',
  'std_verify_scene',
  'std_verify_template',
  'std_verify_token',
  'std_verify_type',
  'std_verify_way'
] as const;

/** MFA 校验通过后，轮询 check_qrconnect 需要携带的 biz 参数 */
function pickQrBizParams(params?: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};

  if (!params) {
    return result;
  }
  for (const key of QR_BIZ_PARAM_KEYS) {
    const value = params[key];

    if (value !== null && value !== undefined) {
      result[key] = String(value);
    }
  }

  return result;
}

function sessionFromConfirmed(http: DouyinHttp, qrToken: string, userData?: QrUserData): QrSession {
  // 新版 uid_tt cookie 已是 hash 形态；frontier device_id / 消息过滤需要数字 uid
  const platformUid =
    userData?.user_id_str ?? (userData?.user_id !== null && userData?.user_id !== undefined ? String(userData.user_id) : undefined) ?? http.jar.get('uid_tt');

  if (!platformUid) {
    throw new Error('confirmed but no platformUid (uid_tt cookie or user_data.user_id_str)');
  }
  const session: QrSession = { platformUid, cookies: http.getCookies(), qrToken };

  if (userData) {
    session.userData = userData;
  }

  return session;
}

/** account_sdk_source_info：优先 Cookie，缺失时以默认 browserInfo 模板编码并回写 */
export function resolveAccountSdkSourceInfo(http: DouyinHttp): string {
  const stored = http.jar.get('sdk_source_info');

  if (stored) {
    return stored;
  }
  const info = encodeBrowserInfo({
    ...DEFAULT_BROWSER_INFO,
    performance: { ...(DEFAULT_BROWSER_INFO.performance as Record<string, unknown>), timeOrigin: Date.now() },
    browser: { ...(DEFAULT_BROWSER_INFO.browser as Record<string, unknown>), t: String(Date.now()) }
  });

  http.jar.set('sdk_source_info', info);

  return info;
}

export function signExtras(http: DouyinHttp, bodyWire = ''): SignPassportExtras {
  const extras: SignPassportExtras = {
    userAgent: http.getUserAgent(),
    enableABogus: http.enableABogus,
    appKey: DESKTOP_PASSPORT_APP_KEY,
    aBogusVariant: 'jumpbyte-desktop',
    bodyWire
  };
  const msToken = http.getMsToken();

  if (msToken) {
    extras.msToken = msToken;
  }

  return extras;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
