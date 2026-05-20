import '../define-children.js';
import '../define-response.js';
import '../define-middleware.js';
import '../define-router.js';
import '../format/message-api.js';
import './event-response.js';
import './event-middleware.js';
import './event-utils.js';
import './event-group.js';
import { cbpClient } from './cbp/index.js';
import { loadModels } from './load-modules/load.js';
import { defaultPort } from '../../common/variable.js';
import { createServer } from './http-server.js';
import { disposeAllRuntimeApps } from './store.js';
import { scheduleCancelByApp, unregisterAppDir } from './schedule-store.js';
import { dispatchDisposeAllApps } from './lifecycle-callbacks.js';

global.__client_loaded = true;

let runtimeDisposed = false;

const disposeRuntime = async () => {
  if (runtimeDisposed) {
    return;
  }
  runtimeDisposed = true;
  await dispatchDisposeAllApps();
  const apps = disposeAllRuntimeApps();

  apps.forEach(app => {
    scheduleCancelByApp(app.name);
    unregisterAppDir(app.name);
  });
};

const shutdown = async (reason: string) => {
  logger.info?.(`[alemonjs][${reason}] 收到信号，正在关闭...`);
  await disposeRuntime();
  process.exit(0);
};

const mainServer = () => {
  const port = process.env.serverPort;

  if (!port) {
    return;
  }
  createServer(port, () => {
    const httpURL = `http://127.0.0.1:${port}`;

    logger.info(`应用服务器: ${httpURL}`);
  });
};

const main = () => {
  const login = process.env.login ?? '';
  const platform = process.env.platform ?? '';
  const url = process.env.url ?? '';
  const port = process.env.port ?? defaultPort;
  const isFullReceive = process.env.is_full_receive === 'true' || process.env.is_full_receive === '1';

  if (!login && !platform && url) {
    logger.info(`[Connecting to CBP server at ${url}]`);
    cbpClient(url);
  } else {
    cbpClient(`http://127.0.0.1:${port}`, { isFullReceive });
  }

  loadModels();
};

const mainProcess = () => {
  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('[alemonjs][unhandledRejection] 未捕获的 Promise 拒绝:', reason);
  });
  process.on('uncaughtException', (error: Error) => {
    logger.error('[alemonjs][uncaughtException] 未捕获的异常:', error);
  });
  ['SIGINT', 'SIGTERM', 'SIGQUIT', 'disconnect'].forEach(sig => {
    process?.on?.(sig, () => void shutdown(sig));
  });
  process?.on?.('exit', code => {
    void disposeRuntime();
    logger.info?.(`[alemonjs][exit] 进程退出，code=${code}`);
  });
  process.on('message', msg => {
    try {
      const data = typeof msg === 'string' ? JSON.parse(msg) : msg;

      if (data?.type === 'start') {
        main();
        mainServer();
      } else if (data?.type === 'stop') {
        void shutdown('stop');
      }
    } catch {}
  });
  if (process.send) {
    process.send({ type: 'ready' });
  }
};

mainProcess();
