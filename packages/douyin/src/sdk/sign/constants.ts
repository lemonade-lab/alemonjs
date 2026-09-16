// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
/** 创作者平台公共常量（源自参考项目 creator/constants.ts 与 passport/signQs.ts） */

export const CREATOR_ORIGIN = 'https://creator.douyin.com';

export const CREATOR_AID = '2906';

export const PASSPORT_JSSDK_VERSION = '2.4.3';

/** 创作者 Passport 基础查询串 SDK 元信息（request_host 为预编码值） */
export const PASSPORT_SDK_META = {
  passport_jssdk_version: PASSPORT_JSSDK_VERSION,
  passport_jssdk_type: 'normal',
  is_from_ttaccountsdk: '1',
  language: 'zh',
  account_sdk_source: 'web',
  p_js_v: PASSPORT_JSSDK_VERSION,
  p_js_t: 'pro',
  p_zt: '3.3.1',
  p_ver: '1.0.29',
  request_host: 'https%3A%2F%2Fcreator.douyin.com',
  p_bd: '1.0.1.16',
  is_from_iesaccountsaas: '1'
} as const;

export const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36';

/** 创作者登录面板（vmok 420）里 tt-account-sdk 的 appKey，aid=2906 */
export const CREATOR_PASSPORT_APP_KEY = '6ddd3ec693f3a124adb29b91b244ece5';

/** 抖音聊天桌面客户端（对齐 douyin-im desktop 常量） */
export const DESKTOP_ORIGIN = 'https://imdesktop.douyin.com';
export const DESKTOP_AID = '339757';
export const DESKTOP_APP_VERSION = '1.2.1';
export const DESKTOP_PASSPORT_APP_KEY = '3c452fb664e3de0e936108429a0bc697';
export const DESKTOP_LOGIN_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) douyinim/1.2.1 Chrome/130.0.6723.58 Electron/33.2.0-rs.21.release.main.1 Safari/537.36';
