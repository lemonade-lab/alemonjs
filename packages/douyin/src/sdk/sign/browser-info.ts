// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
import { encodeAccountSdkSourceInfo } from './source-info.js';

export function encodeBrowserInfo(browserInfo: Record<string, unknown>): string {
  return encodeAccountSdkSourceInfo(JSON.stringify(browserInfo));
}

/** 与抓包解码后的 browserInfo 结构一致（脱敏模板，无用户 id） */
export const DEFAULT_BROWSER_INFO: Record<string, unknown> = {
  hardwareConcurrency: 10,
  webdriver: false,
  chromedriver: false,
  shelldriver: false,
  plugins: 5,
  permissions: [{ name: 'notifications', state: 'prompt' }],
  innerHeight: 982,
  innerWidth: 1728,
  outerHeight: 1117,
  outerWidth: 1728,
  stoargeStatus: {
    indexedDB: {
      idb: 'object',
      open: 'function',
      indexedDB: 'object',
      IDBKeyRange: 'function',
      openDatabase: 'undefined',
      isSafari: false,
      hasFetch: true
    },
    localStorage: { isSupportLStorage: true, size: 0, write: true },
    storageQuotaStatus: { usage: 0, quota: 10737426463, isPrivate: false }
  },
  webgl: {
    vendor: 'Google Inc. (Apple)',
    renderer: 'ANGLE (Apple, ANGLE Metal Renderer: Apple M5, Unspecified Version)'
  },
  notificationPermission: 'default',
  performance: {
    timeOrigin: Date.now(),
    usedJSHeapSize: 50_000_000,
    navigationTiming: {
      entryType: 'navigation',
      initiatorType: 'navigation',
      name: 'https://creator.douyin.com/creator-micro/home'
    }
  },
  request_host: 'creator.douyin.com',
  request_pathname: '/creator-micro/home',
  browser: {
    t: String(Date.now()),
    bit_protocol: 'false',
    bit_helper: false
  }
};

/** jumpbyte desktop 登录使用的稳定 Windows/Electron browserInfo */
export function desktopLoginBrowserInfo(deviceId: string): Record<string, unknown> {
  return {
    hardwareConcurrency: 8,
    webdriver: false,
    chromedriver: false,
    shelldriver: false,
    plugins: 5,
    permissions: [{ name: 'notifications', state: 'granted' }],
    innerHeight: 484,
    innerWidth: 726,
    outerHeight: 484,
    outerWidth: 726,
    stoargeStatus: {
      indexedDB: {
        idb: 'object',
        open: 'function',
        indexedDB: 'object',
        IDBKeyRange: 'function',
        openDatabase: 'function',
        isSafari: false,
        hasFetch: false
      },
      localStorage: { isSupportLStorage: true, size: 1993, write: true },
      storageQuotaStatus: { usage: 0, quota: 36104626176, isPrivate: false }
    },
    webgl: {
      vendor: 'Google Inc. (Google)',
      renderer: 'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)'
    },
    notificationPermission: 'granted',
    performance: {
      timeOrigin: 1787813991280.3,
      usedJSHeapSize: 18200000,
      navigationTiming: {
        decodedBodySize: 2527,
        entryType: 'navigation',
        initiatorType: 'navigation',
        name: `file:///renderer/login/index.html?window=login&channel=0&guid=${deviceId}`,
        renderBlockingStatus: 'non-blocking'
      }
    },
    request_host: '',
    request_pathname: '/renderer/login/index.html',
    browser: { t: '7781993187871', bit_protocol: 'false', bit_helper: false }
  };
}
