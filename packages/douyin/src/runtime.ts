import { randomUUID } from 'node:crypto';
import { cbpPlatform, type ConnectionLoginStatus } from 'alemonjs/platform';
import { createAccountManager, type AccountManager } from './sdk/index.js';
import { DouyinAdapter } from './adapter.js';
import { platform, type Options } from './config.js';

/** Starts the framework transport before any credential acquisition. */
export function startDirectAdapter(
  config: Options,
  dependencies: {
    cbp?: Pick<ReturnType<typeof cbpPlatform>, 'send' | 'onactions'>;
    manager?: AccountManager;
    bindSignals?: boolean;
  } = {}
) {
  const cbp = dependencies.cbp ?? cbpPlatform(`ws://127.0.0.1:${process.env.port || 17117}`);
  const manager =
    dependencies.manager ?? createAccountManager({ accountsDir: config.accounts_dir, disabledAccounts: config.disabled_accounts, warmupOnRestore: false });
  const adapter = new DouyinAdapter(manager.accounts, event => cbp.send(event), config.bot_id);
  let stopped = false;
  const controller = new AbortController();
  let login: ConnectionLoginStatus = { state: 'not_required', updatedAt: Date.now() };

  cbp.onactions((data, consume) => {
    void adapter.handle(data.action, data.payload).then(results => {
      if (data.action === 'connection.status') {
        results[0].data = { ...adapter.getStatus(), login };
      }
      consume(results);
    });
  });
  const stop = () => {
    if (stopped) {
      return;
    }
    stopped = true;
    controller.abort();
    adapter.stop();
    manager.stop();
    process.off('SIGINT', stop);
    process.off('SIGTERM', stop);
    process.off('disconnect', stop);
    process.off('message', onMessage);
  };
  const onMessage = (message: unknown) => {
    if (message && typeof message === 'object' && 'type' in message && message.type === 'stop') {
      stop();
    }
  };

  if (dependencies.bindSignals !== false) {
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
    process.once('disconnect', stop);
    process.on('message', onMessage);
  }
  const ready = (async () => {
    await manager.restore();
    if (stopped) {
      manager.stop();

      return;
    }
    if (!manager.accounts.size && config.login_qrcode !== false) {
      const LoginId = randomUUID();
      const account = await manager.loginByQr({
        signal: controller.signal,
        onVerifyUrl() {
          throw new Error('Additional verification requires the SDK login interface');
        },
        onQr(info) {
          if (stopped) {
            throw new Error('Adapter stopped');
          }
          const QRCode = { url: info.qrcodeIndexUrl ?? '', imageBase64: info.qrcodeBase64, format: 'png' as const };

          login = { state: 'awaiting_qrcode', type: 'qrcode', loginId: LoginId, qrcode: QRCode, updatedAt: Date.now() };
          cbp.send({ name: 'login.qrcode', Platform: platform, value: '', LoginId, LoginType: 'qrcode', QRCode });
        },
        onStatus() {
          if (stopped) {
            throw new Error('Adapter stopped');
          }
        }
      });

      if (stopped) {
        manager.stop();

        return;
      }
      login = { state: 'authorized', type: 'qrcode', loginId: LoginId, updatedAt: Date.now() };
      cbp.send({ name: 'login.success', Platform: platform, value: '', LoginId, LoginType: 'qrcode', BotId: account.platformUid, UserId: account.platformUid });
    }
    await Promise.all([...manager.accounts.values()].map(account => adapter.start(account)));
  })().catch(() => {
    if (stopped) {
      return;
    }
    login = { state: 'failed', updatedAt: Date.now(), lastError: '账号恢复或登录失败，请检查本地会话及登录验证要求' };
  });

  return { stop, ready, adapter };
}
