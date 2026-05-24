import { logger } from './common/logger.js';

let runtimeStarted = false;
let stopping = false;

const normalizeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack
    };
  }

  return {
    message: typeof error === 'string' ? error : 'Unknown platform bootstrap error'
  };
};

const notifyParent = (message: Record<string, unknown>) => {
  if (typeof process.send === 'function') {
    process.send(message);
  }
};

const shutdown = (reason: string) => {
  if (stopping) {
    return;
  }

  stopping = true;
  logger.info?.(`[platform-bootstrap][${reason}] 收到信号，正在关闭...`);
  setImmediate(() => process.exit(0));
};

const startRuntime = async () => {
  if (runtimeStarted) {
    return;
  }

  runtimeStarted = true;
  global.__platform_bootstrap_loaded = true;

  try {
    const entryPath = String(process.env.__ALEMON_PLATFORM_ENTRY ?? '').trim();

    if (!entryPath) {
      throw new Error('Missing __ALEMON_PLATFORM_ENTRY');
    }

    const importPath = entryPath.startsWith('file://') ? entryPath : `file://${entryPath}`;
    const mod = await import(importPath);
    const run = typeof mod.default === 'function' ? mod.default : typeof mod.main === 'function' ? mod.main : null;

    if (typeof run !== 'function') {
      throw new Error('Platform entry must export a callable default or main function');
    }

    await run();
    notifyParent({ type: 'app_ready', protocolVersion: 'v2' });
  } catch (error) {
    notifyParent({
      type: 'boot_error',
      protocolVersion: 'v2',
      stage: 'app',
      error: normalizeError(error)
    });
    logger.error?.('[platform-bootstrap] 启动失败', error);
    process.exitCode = 1;
    setImmediate(() => process.exit(1));
  }
};

process.on('unhandledRejection', (reason: unknown) => {
  logger.error?.('[platform-bootstrap][unhandledRejection]', reason);
});
process.on('uncaughtException', (error: Error) => {
  logger.error?.('[platform-bootstrap][uncaughtException]', error);
});
['SIGINT', 'SIGTERM', 'SIGQUIT', 'disconnect'].forEach(sig => {
  process?.on?.(sig, () => shutdown(sig));
});
process?.on?.('exit', code => {
  logger.info?.(`[platform-bootstrap][exit] 进程退出，code=${code}`);
});
process.on('message', msg => {
  try {
    const data = typeof msg === 'string' ? JSON.parse(msg) : msg;

    if (data?.type === 'start') {
      void startRuntime();
    } else if (data?.type === 'stop') {
      shutdown('stop');
    }
  } catch {}
});

notifyParent({ type: 'ready', protocolVersion: 'v2' });
