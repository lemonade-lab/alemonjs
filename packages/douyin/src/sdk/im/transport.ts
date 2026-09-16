// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
import { logger } from '../logger.js';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { encodeRequest, decodeResponseRaw } from './protocol/index.js';
import type { DouyinHttp } from '../http/client.js';

/** 官方 PC 客户端 UA（媒体上传与 Cookie 通道共用） */
export const DESKTOP_PC_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) douyin/8.5.302 Chrome/136.0.7103.59 Electron/36.4.0-rs.31.release.pgo.7 TTElectron/36.4.0-rs.31.release.pgo.7 Safari/537.36 awemePcClient/8.5.302 buildId/469548567 osName/Windows';

/** Desktop Cookie 通道 profile（对照官方 native ImOption；设备身份走 URL query 而非 envelope headers） */
const DESKTOP_IM_PROFILE = {
  appId: 339757,
  appName: 'aweme_im_desktop',
  version: '1.2.1',
  buildNumber: 'eb11b84dd0eb26ae22321b53426d3f976b920862',
  apiUrl: 'https://imapi3-normal.zijieapi.com',
  access: 'cpp_sdk',
  biz: 'douyin_im_pc'
} as const;

/** 官方桌面 IM 客户端 UA */
const DESKTOP_IM_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) douyinim/1.2.1 Chrome/130.0.6723.58 Electron/33.2.0 Safari/537.36';

/** config/v2 与 batch_play_info 共用的 desktop 指纹 query（媒体上传用）。 */
export function desktopFingerprintParams(deviceId: string, guid: string): URLSearchParams {
  return new URLSearchParams({
    aid: '339757',
    version_name: '1.1.33',
    version_code: '1.1.33',
    device_platform: 'win32',
    os_version: '10.0.26200',
    screen_width: '1707',
    screen_height: '1067',
    browser_language: 'zh-CN',
    browser_platform: 'Win32',
    browser_name: 'Mozilla',
    browser_version: DESKTOP_PC_UA.replace(/^Mozilla\//, ''),
    browser_online: 'true',
    cookie_enabled: 'true',
    device_id: deviceId,
    did: deviceId,
    iid: '0',
    awemeim_guid: guid,
    channel: '0'
  });
}

/** imapi envelope headers KV（Desktop Cookie 通道，对照官方 PC 客户端抓包形状）；HTTP 发送通道 f15 复用 */
export function desktopEnvelopeHeaders(deviceId: string): Record<string, string> {
  return {
    session_aid: '6383',
    session_did: deviceId,
    app_name: 'douyin_pc',
    priority_region: 'cn',
    user_agent: DESKTOP_PC_UA,
    cookie_enabled: 'true',
    browser_language: 'zh-CN',
    browser_platform: 'Win32',
    browser_name: 'Mozilla',
    browser_version: DESKTOP_PC_UA.replace(/^Mozilla\//, ''),
    browser_online: 'true',
    referer: 'https://www.douyin.com/',
    timezone_name: 'Asia/Shanghai',
    'is-retry': '0'
  };
}

/** 官方桌面客户端 queryMap（设备身份载体；native ImOption.headersMap 为空） */
function desktopImQuery(deviceId: string): Record<string, string> {
  return {
    aid: String(DESKTOP_IM_PROFILE.appId),
    app_name: DESKTOP_IM_PROFILE.appName,
    did: deviceId,
    device_id: deviceId,
    iid: '0',
    channel: '0',
    os_version: os.release(),
    version_code: DESKTOP_IM_PROFILE.version,
    version_name: DESKTOP_IM_PROFILE.version,
    device_platform: 'windows',
    device_type: process.arch,
    device_brand: ''
  };
}

/**
 * HTTP protobuf 通道：Desktop cookie 通道（发送/收件箱查询/动作/撤回/陌生人消息）
 */
export class ImProtoTransport {
  constructor(private readonly http: DouyinHttp) {}

  /** Desktop Cookie 通道（native ImOption profile：设备身份在 URL query，envelope headers 为空）。 */
  async sendCookieProto(cmd: number, inboxType: number, endpoint: string, body: Record<string, unknown>, deviceId: string): Promise<Record<string, unknown>> {
    const payload = await encodeRequest({
      token: '',
      cmd,
      inboxType,
      body,
      authType: 1,
      deviceId,
      sdkVersion: DESKTOP_IM_PROFILE.version,
      buildNumber: DESKTOP_IM_PROFILE.buildNumber,
      versionCode: DESKTOP_IM_PROFILE.version,
      devicePlatform: 'windows',
      biz: DESKTOP_IM_PROFILE.biz,
      access: DESKTOP_IM_PROFILE.access,
      headers: {}
    });
    const url = new URL(endpoint, DESKTOP_IM_PROFILE.apiUrl);

    for (const [key, value] of Object.entries(desktopImQuery(deviceId))) {
      url.searchParams.set(key, value);
    }
    const requestBody = Buffer.from(payload);
    const res = await this.http.requestBytes(url.toString(), {
      method: 'POST',
      headers: {
        Accept: 'x-protobuf',
        'Content-Type': 'application/x-protobuf',
        // Native Cronet SetMD5Header：请求体 MD5 hex（非签名，但缺失会被网关拒绝）
        'x-ss-stub': createHash('md5').update(requestBody).digest('hex'),
        'User-Agent': DESKTOP_IM_UA,
        Referer: 'https://imdesktop.douyin.com'
      },
      body: requestBody
    });

    if (!res.ok) {
      throw new Error(`IM Cookie HTTP ${res.status} ${endpoint}: ${Buffer.from(res.data).toString('utf8', 0, 200)}`);
    }
    try {
      const decoded = await decodeResponseRaw(res.data);

      logEnvelope(cmd, endpoint, decoded);

      return decoded;
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);

      throw new Error(`IM Cookie response decode failed cmd=${cmd} ${endpoint}: ${detail}`);
    }
  }
}

/** envelope 响应状态日志（失败 WARN，成功 debug） */
function logEnvelope(cmd: number, endpoint: string, decoded: Record<string, unknown>): void {
  const statusCode = Number(decoded['statusCode'] ?? 0);

  if (statusCode !== 0) {
    logger.warn(`[douyin:im] cmd=${cmd} ${endpoint} 失败: statusCode=${statusCode} errorDesc=${String(decoded['errorDesc'] ?? '')}`);

    return;
  }
  logger.debug(`[douyin:im] cmd=${cmd} ${endpoint} ok`);
}
