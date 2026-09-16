import { join } from 'node:path';
import { DouyinHttp } from '../http/index.js';
import { AccountStore, type AccountRecord } from '../store/index.js';
import { ImClient } from '../im/client.js';
import {
  desktopTtwidCheck,
  fetchDesktopSelfProfile,
  getQrcode,
  pollQrConfirm,
  runPassportWarmup,
  setupDesktopDevice,
  type DesktopDeviceIdentity,
  type QrCodeInfo,
  type QrLoginOptions,
  type QrSession
} from '../auth/index.js';
import { DESKTOP_LOGIN_USER_AGENT } from '../sign/constants.js';

export interface DouyinAccount {
  platformUid: string;
  config: { name?: string };
  http: DouyinHttp;
  client: ImClient;
}

export type AccountMap = Map<string, DouyinAccount>;

export interface AccountManagerOptions {
  accountsDir?: string;
  /** IDs or saved account names to skip during restore. */
  disabledAccounts?: string[];
  /** Refresh Passport cookies when restoring sessions; default true. */
  warmupOnRestore?: boolean;
}

export interface AccountManager {
  store: AccountStore;
  accounts: AccountMap;
  restore(): Promise<void>;
  loginByQr(options: QrLoginOptions & { onQr: (info: QrCodeInfo) => void }): Promise<DouyinAccount>;
  /** Import an existing authorized session and persist it. Does not connect WS. */
  importSession(session: Pick<QrSession, 'platformUid' | 'cookies' | 'userData'>, device?: DesktopDeviceIdentity): DouyinAccount;
  logout(platformUid: string): void;
  /** Stop all clients without deleting saved sessions. */
  stop(): void;
}

/** Standalone account manager. No framework configuration or import-time IO. */
export function createAccountManager(options: AccountManagerOptions = {}): AccountManager {
  const accountsDir = options.accountsDir ?? join(process.cwd(), 'data', 'douyin', 'accounts');
  const store = new AccountStore({ accountsDir });
  const accounts: AccountMap = new Map();

  const build = (record: AccountRecord): DouyinAccount => {
    const http = new DouyinHttp({ initialCookies: record.session.cookies, msToken: record.session.msToken, userAgent: DESKTOP_LOGIN_USER_AGENT });
    const deviceId = record.session.deviceId ?? store.ensureDeviceId(record.platformUid);

    if (record.deviceProfile) {
      http.setDevice(record.deviceProfile);
    } else {
      http.deviceId = deviceId;
    }
    const account: DouyinAccount = {
      platformUid: record.platformUid,
      config: { name: record.screenName },
      http,
      client: new ImClient({ http, userId: record.platformUid, cookies: record.session.cookies, deviceId })
    };

    accounts.get(record.platformUid)?.client.stop();
    accounts.set(record.platformUid, account);

    return account;
  };

  const importSession: AccountManager['importSession'] = (session, device) => {
    if (!session.cookies.trim()) {
      throw new Error('Session cookies are required');
    }
    const previous = store.load(session.platformUid);
    const now = new Date().toISOString();
    const profile = device ?? previous?.deviceProfile;
    const record: AccountRecord = {
      ...previous,
      platformUid: session.platformUid,
      session: {
        cookies: session.cookies,
        deviceId: profile?.deviceId ?? previous?.session.deviceId ?? store.ensureDeviceId(session.platformUid),
        verifiedAt: now
      },
      userData: session.userData ?? previous?.userData,
      screenName: session.userData?.screen_name ?? previous?.screenName,
      deviceProfile: profile,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now
    };

    store.save(session.platformUid, record);

    return build(record);
  };

  return {
    store,
    accounts,
    importSession,
    async restore() {
      const disabled = new Set(options.disabledAccounts ?? []);

      for (const record of store.list()) {
        if (!record.session.cookies?.trim() || disabled.has(record.platformUid) || disabled.has(record.screenName ?? '')) {
          continue;
        }
        const account = build(record);

        if (options.warmupOnRestore !== false) {
          await runPassportWarmup(account.http);
        }
      }
    },
    async loginByQr(loginOptions) {
      loginOptions.signal?.throwIfAborted();
      if (typeof loginOptions?.onQr !== 'function') {
        throw new Error('loginByQr requires onQr');
      }
      const http = new DouyinHttp({ userAgent: DESKTOP_LOGIN_USER_AGENT });
      const device = await setupDesktopDevice(join(accountsDir, 'device.json'), http);

      await desktopTtwidCheck(http);
      const qr = await getQrcode(http);

      loginOptions.signal?.throwIfAborted();
      loginOptions.onQr(qr);
      const session = await pollQrConfirm(http, qr.token, loginOptions);
      // Failure to fetch optional display data must not discard a confirmed login.
      const profile = await fetchDesktopSelfProfile(http).catch(() => undefined);

      if (profile) {
        session.userData = {
          ...session.userData,
          ...(profile.nickname ? { screen_name: profile.nickname } : {}),
          ...(profile.avatar ? { avatar_url: profile.avatar } : {})
        };
      }

      loginOptions.signal?.throwIfAborted();

      return importSession({ ...session, cookies: http.getCookies() }, device);
    },
    logout(platformUid) {
      store.remove(platformUid);
      accounts.get(platformUid)?.client.stop();
      accounts.delete(platformUid);
    },
    stop() {
      for (const account of accounts.values()) {
        account.client.stop();
      }
      accounts.clear();
    }
  };
}
