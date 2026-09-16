// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
export type QrConnectStatus = 'new' | 'scanned' | 'confirmed' | 'expired' | (string & {});

export interface QrUserData {
  app_id?: number;
  user_id?: number;
  user_id_str?: string;
  sec_user_id?: string;
  screen_name?: string;
  name?: string;
  avatar_url?: string;
  mobile?: string;
  has_password?: number;
  country_code?: number;
  [key: string]: unknown;
}

export interface GetQrcodeData {
  token: string;
  qrcode: string;
  expire_time: number;
  error_code: number;
  qrcode_index_url?: string;
  app_name?: string;
  web_name?: string;
}

export interface GetQrcodeResponse {
  message: string;
  data: GetQrcodeData;
}

/** 服务端可选的二次验证方式（assist_ 前缀 = 安全手机） */
export interface QrVerifyWay {
  verify_way?: string;
  mobile?: string;
  sms_content?: string;
  channel_mobile?: string;
  [key: string]: unknown;
}

export interface CheckQrconnectData {
  status?: QrConnectStatus;
  error_code: number;
  account_flow?: string;
  encrypt_uid?: string;
  biz_params?: Record<string, unknown>;
  common_params?: Record<string, unknown>;
  verify_ways?: QrVerifyWay[];
  /** 验证中心决策 conf（JSON 串或对象）：需在本地验证页完成官方安全验证后重试 */
  verify_center_decision_conf?: string | Record<string, unknown>;
  /** 验证中心二次决策 conf：一次验证通过后服务端可能再次下发 */
  verify_center_secondary_decision_conf?: string | Record<string, unknown>;
  verify_ticket?: string;
  captcha?: string;
  description?: string;
  desc_url?: string;
  extra?: string;
  redirect_url?: string;
  scan_app_id?: number;
  user_data?: QrUserData;
  scan_user_info?: Record<string, unknown>;
  scan_device_info?: Record<string, unknown>;
}

export interface CheckQrconnectResponse {
  message: string;
  data: CheckQrconnectData;
}

export interface QrCodeInfo {
  token: string;
  qrcodeBase64: string;
  expireTime: number;
  /** 扫码页 URL，可用于终端 ASCII 二维码 */
  qrcodeIndexUrl?: string;
}

/** 扫码登录会话；platformUid 优先 Cookie uid_tt，其次 user_data.user_id_str */
export interface QrSession {
  platformUid: string;
  cookies: string;
  userData?: QrUserData;
  qrToken: string;
}

/** 扫码登录触发短信 MFA 时的挑战参数 */
export interface QrMfaChallenge {
  encrypt_uid?: string;
  biz_params?: Record<string, unknown>;
  common_params?: Record<string, unknown>;
}

/** desktop lite MFA 接口响应 envelope */
export interface QrMfaResponse {
  message?: string;
  data: {
    mobile?: string | number;
    ticket?: string;
    error_code?: number;
    description?: string;
    [key: string]: unknown;
  };
}

export interface QrLoginOptions {
  /** Stops polling and prevents persisting a session after cancellation. */
  signal?: AbortSignal;
  pollIntervalMs?: number;
  timeoutMs?: number;
  onStatus?: (status: QrConnectStatus) => void;
  /** 触发验证中心安全验证时回调：返回本地验证页链接（推给用户在浏览器打开） */
  onVerifyUrl?: (url: string) => void;
  /** 触发二次验证时回调：kind=sms 返回短信验证码，kind=password 返回账号密码；未提供则登录失败 */
  onMfa?: (info: { maskedMobile?: string; kind?: 'sms' | 'password' }) => string | Promise<string>;
}
