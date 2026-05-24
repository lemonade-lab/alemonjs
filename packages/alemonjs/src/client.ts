import { logger } from './common/logger.js';

let runtimeModulePromise: Promise<typeof import('./application/runtime/client-runtime.js')> | null = null;
let runtimeStarted = false;
let stopping = false;

const notifyParent = (message: Record<string, unknown>) => {
  if (typeof process.send === 'function') {
    process.send(message);
  }
};

const normalizeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack
    };
  }

  return {
    message: typeof error === 'string' ? error : 'Unknown client bootstrap error'
  };
};

const loadRuntimeModule = async () => {
  runtimeModulePromise ??= import('./application/runtime/client-runtime.js');

  return runtimeModulePromise;
};

const shutdown = async (reason: string) => {
  if (stopping) {
    return;
  }

  stopping = true;
  logger.info?.(`[client-bootstrap][${reason}] 收到信号，正在关闭...`);

  try {
    const runtimeModule = runtimeModulePromise ? await runtimeModulePromise : null;

    if (runtimeModule?.disposeClientRuntime) {
      await runtimeModule.disposeClientRuntime();
    }
  } catch (error) {
    logger.error?.('[client-bootstrap] 关闭失败', error);
  }

  process.exit(0);
};

const startRuntime = async () => {
  if (runtimeStarted) {
    return;
  }

  runtimeStarted = true;

  try {
    const runtimeModule = await loadRuntimeModule();

    if (typeof runtimeModule.startClientRuntime !== 'function') {
      throw new Error('Client runtime missing startClientRuntime');
    }

    await runtimeModule.startClientRuntime();
  } catch (error) {
    notifyParent({
      type: 'boot_error',
      protocolVersion: 'v2',
      stage: 'app',
      error: normalizeError(error)
    });
    logger.error?.('[client-bootstrap] 启动失败', error);
    process.exitCode = 1;
    setImmediate(() => process.exit(1));
  }
};

process.on('unhandledRejection', (reason: unknown) => {
  logger.error?.('[client-bootstrap][unhandledRejection]', reason);
});
process.on('uncaughtException', (error: Error) => {
  logger.error?.('[client-bootstrap][uncaughtException]', error);
});
['SIGINT', 'SIGTERM', 'SIGQUIT', 'disconnect'].forEach(sig => {
  process?.on?.(sig, () => void shutdown(sig));
});
process?.on?.('exit', code => {
  logger.info?.(`[client-bootstrap][exit] 进程退出，code=${code}`);
});
process.on('message', msg => {
  try {
    const data = typeof msg === 'string' ? JSON.parse(msg) : msg;

    if (data?.type === 'start') {
      void startRuntime();
    } else if (data?.type === 'stop') {
      void shutdown('stop');
    }
  } catch {}
});

notifyParent({ type: 'ready', protocolVersion: 'v2' });
