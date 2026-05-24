import childProcess from 'child_process';
import { getConfigValue, ResultCode } from '../../common/index.js';
import module from 'module';
import { setPlatformChild, forwardFromPlatform } from './ipc-bridge';
import type { AdapterProtocolVersion, AdapterTransportMode, ProcessAdapterState } from './types';

const initRequire = () => {};

initRequire.resolve = () => '';
const require = module?.createRequire?.(import.meta.url) ?? initRequire;

type PlatformProcessConfig = {
  restartDelay: number;
  controlReadyTimeout: number;
  transportReadyTimeout: number;
  appReadyTimeout: number;
  maxRestartDelay: number;
  legacyTransportGraceMs: number;
};

type ChildProcessManager = {
  child?: childProcess.ChildProcess;
  isKilling: boolean;
  restartRequested: boolean;
  transportReady: boolean;
  appReady: boolean;
  protocolVersion: AdapterProtocolVersion;
  fallbackToImportOnExit: boolean;
  controlTimer?: NodeJS.Timeout;
  transportTimer?: NodeJS.Timeout;
  appTimer?: NodeJS.Timeout;
  legacyTransportTimer?: NodeJS.Timeout;
};

const createInitialState = (): ProcessAdapterState => ({
  phase: 'idle',
  protocolVersion: 'legacy',
  transportMode: 'unknown',
  restartCount: 0,
  consecutiveFailures: 0,
  legacyReadyMode: false,
  bootTimings: {},
  lastError: null
});

let platformManager: ChildProcessManager | null = null;
let platformState: ProcessAdapterState = createInitialState();
let platformProcessConfig: PlatformProcessConfig | null = null;
let platformBootstrapPath = '';
let platformEntryPath = '';

const normalizeErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === 'string' ? error : 'Unknown process adapter error';
};

const isDebugEnabled = () => process.env.NODE_ENV === 'development';

const debugLog = (message: string, data: Record<string, unknown> = {}) => {
  if (!isDebugEnabled()) {
    return;
  }

  logger.debug?.({
    message,
    data
  });
};

const clearTimer = (timer?: NodeJS.Timeout) => {
  if (timer) {
    clearTimeout(timer);
  }
};

const clearManagerTimers = (manager: ChildProcessManager | null) => {
  clearTimer(manager?.controlTimer);
  clearTimer(manager?.transportTimer);
  clearTimer(manager?.appTimer);
  clearTimer(manager?.legacyTransportTimer);

  if (manager) {
    manager.controlTimer = undefined;
    manager.transportTimer = undefined;
    manager.appTimer = undefined;
    manager.legacyTransportTimer = undefined;
  }
};

const buildConfig = (): PlatformProcessConfig => {
  const values = getConfigValue();
  const pro = values?.process ?? {};

  return {
    restartDelay: Number(pro?.restart_delay ?? 3000),
    controlReadyTimeout: Number(pro?.control_ready_timeout ?? 10000),
    transportReadyTimeout: Number(pro?.transport_ready_timeout ?? 15000),
    appReadyTimeout: Number(pro?.app_ready_timeout ?? 30000),
    maxRestartDelay: Number(pro?.max_restart_delay ?? 30000),
    legacyTransportGraceMs: Number(pro?.legacy_transport_grace_ms ?? 50)
  };
};

const resetBootState = () => {
  platformState = {
    ...platformState,
    phase: 'booting',
    protocolVersion: 'legacy',
    transportMode: 'unknown',
    legacyReadyMode: false,
    startedAt: Date.now(),
    lastReadyAt: undefined,
    lastTransportReadyAt: undefined,
    lastAppReadyAt: undefined,
    bootTimings: {},
    lastError: null
  };
};

const updateTransportBinding = (transportMode: AdapterTransportMode) => {
  if (transportMode === 'ipc' && platformManager?.child) {
    setPlatformChild(platformManager.child);
  } else {
    setPlatformChild(null);
  }
};

const markFailure = (error?: unknown) => {
  platformState = {
    ...platformState,
    phase: 'failed',
    lastError: error ? normalizeErrorMessage(error) : platformState.lastError,
    consecutiveFailures: platformState.consecutiveFailures + 1
  };
};

const markTransportReady = (transport: AdapterTransportMode, legacyReadyMode = false) => {
  const now = Date.now();

  if (!platformManager) {
    return;
  }

  platformManager.transportReady = true;
  clearTimer(platformManager.transportTimer);
  clearTimer(platformManager.legacyTransportTimer);
  platformManager.transportTimer = undefined;
  platformManager.legacyTransportTimer = undefined;

  platformState = {
    ...platformState,
    phase: platformState.lastAppReadyAt ? 'app_ready' : 'transport_ready',
    transportMode: transport,
    lastTransportReadyAt: now,
    legacyReadyMode,
    consecutiveFailures: 0,
    bootTimings: {
      ...platformState.bootTimings,
      readyToTransportReadyMs: platformState.lastReadyAt ? now - platformState.lastReadyAt : undefined,
      transportReadyToAppReadyMs: platformState.lastAppReadyAt ? platformState.lastAppReadyAt - now : platformState.bootTimings.transportReadyToAppReadyMs
    }
  };

  updateTransportBinding(transport);

  if (legacyReadyMode) {
    debugLog('platform adapter fallback to legacy transport ready');
  }
};

const scheduleRestart = (reason: string) => {
  if (!platformProcessConfig || !platformBootstrapPath || !platformEntryPath) {
    return;
  }

  const baseDelay = platformProcessConfig.restartDelay;
  const delay = Math.min(baseDelay * 2 ** Math.max(platformState.consecutiveFailures - 1, 0), platformProcessConfig.maxRestartDelay);

  platformState = {
    ...platformState,
    restartCount: platformState.restartCount + 1
  };

  debugLog('schedule platform adapter restart', { reason, delay });

  setTimeout(() => {
    void startPlatformAdapterWithFallback();
  }, delay);
};

const cleanupManager = (manager: ChildProcessManager | null) => {
  clearManagerTimers(manager);

  if (manager?.child) {
    manager.child.removeAllListeners();
  }

  setPlatformChild(null);

  if (platformManager === manager) {
    platformManager = null;
  }
};

const startByImport = async () => {
  try {
    const importPath = platformEntryPath.startsWith('file://') ? platformEntryPath : `file://${platformEntryPath}`;
    const mod = await import(importPath);
    const run = typeof mod.default === 'function' ? mod.default : typeof mod.main === 'function' ? mod.main : null;

    if (typeof run !== 'function') {
      throw new Error('Platform entry must export a callable default or main function');
    }

    await run();

    platformState = {
      ...platformState,
      phase: 'app_ready',
      protocolVersion: 'legacy',
      transportMode: 'import',
      consecutiveFailures: 0,
      lastTransportReadyAt: Date.now(),
      lastAppReadyAt: Date.now()
    };

    debugLog('platform adapter started via import fallback');
  } catch (error) {
    logger?.error?.({
      code: ResultCode.Fail,
      message: 'import 启动平台连接失败',
      data: error
    });
    markFailure(error);
    scheduleRestart('import_fallback_failed');
  }
};

const handleControlReady = (manager: ChildProcessManager, message: Record<string, unknown>) => {
  const protocolVersion = message.protocolVersion === 'v2' ? 'v2' : 'legacy';
  const now = Date.now();

  manager.protocolVersion = protocolVersion;
  clearTimer(manager.controlTimer);
  manager.controlTimer = undefined;

  platformState = {
    ...platformState,
    phase: 'control_ready',
    protocolVersion,
    legacyReadyMode: protocolVersion === 'legacy',
    lastReadyAt: now,
    bootTimings: {
      ...platformState.bootTimings,
      forkToReadyMs: platformState.startedAt ? now - platformState.startedAt : undefined
    }
  };

  manager.child?.send?.({ type: 'start' });

  if (protocolVersion === 'v2') {
    manager.transportTimer = setTimeout(() => {
      logger?.warn?.({
        code: ResultCode.Fail,
        message: '平台连接进程未在规定时间内建立通讯层，准备降级/重启',
        data: null
      });
      manager.isKilling = true;
      manager.fallbackToImportOnExit = Boolean(process.env.port);
      markFailure('transport_ready_timeout');

      try {
        manager.child?.kill();
      } catch {
        cleanupManager(manager);

        if (manager.fallbackToImportOnExit) {
          void startByImport();
        } else {
          scheduleRestart('transport_ready_timeout');
        }
      }
    }, platformProcessConfig?.transportReadyTimeout ?? 15000);

    manager.appTimer = setTimeout(() => {
      logger?.warn?.({
        code: ResultCode.Warn,
        message: '平台连接进程业务初始化较慢，尚未收到 app_ready',
        data: null
      });
    }, platformProcessConfig?.appReadyTimeout ?? 30000);
  } else {
    const legacyTransportMode: AdapterTransportMode = process.env.__ALEMON_DIRECT_SOCK ? 'direct' : 'ipc';

    manager.legacyTransportTimer = setTimeout(() => {
      if (!manager.transportReady) {
        markTransportReady(legacyTransportMode, true);
      }
    }, platformProcessConfig?.legacyTransportGraceMs ?? 50);
  }
};

const handleMessage = (manager: ChildProcessManager, message: unknown) => {
  const data = typeof message === 'string' ? JSON.parse(message) : message;

  if (data?.type === 'ready') {
    handleControlReady(manager, data as Record<string, unknown>);

    return;
  }

  if (data?.type === 'transport_ready') {
    markTransportReady((data.transport as AdapterTransportMode) ?? 'unknown');

    return;
  }

  if (data?.type === 'app_ready') {
    const now = Date.now();

    manager.appReady = true;
    clearTimer(manager.appTimer);
    manager.appTimer = undefined;

    platformState = {
      ...platformState,
      phase: 'app_ready',
      lastAppReadyAt: now,
      bootTimings: {
        ...platformState.bootTimings,
        transportReadyToAppReadyMs: platformState.lastTransportReadyAt
          ? now - platformState.lastTransportReadyAt
          : platformState.bootTimings.transportReadyToAppReadyMs
      }
    };

    return;
  }

  if (data?.type === 'boot_error') {
    platformState = {
      ...platformState,
      lastError: normalizeErrorMessage(data.error?.message ?? data.error)
    };

    logger?.warn?.({
      code: ResultCode.Fail,
      message: `平台连接进程启动阶段失败: ${String(data.stage ?? 'unknown')}`,
      data: data.error ?? null
    });

    return;
  }

  if (data?.type === 'ipc:data') {
    forwardFromPlatform(data.data);
  }
};

export const getPlatformAdapterState = (): ProcessAdapterState => ({
  ...platformState,
  bootTimings: { ...platformState.bootTimings }
});

export function restartPlatformAdapter(): void {
  if (!platformManager?.child) {
    void startPlatformAdapterWithFallback();

    return;
  }

  if (platformManager.restartRequested) {
    return;
  }

  platformManager.restartRequested = true;
  platformManager.isKilling = true;
  platformState = {
    ...platformState,
    phase: 'stopping'
  };
  clearManagerTimers(platformManager);

  try {
    platformManager.child.kill();
  } catch {
    cleanupManager(platformManager);
    scheduleRestart('manual_restart');
  }
}

export function startPlatformAdapterWithFallback(): Promise<void> {
  platformProcessConfig = buildConfig();
  const platformPath = process.env.platform;

  if (!platformPath) {
    logger?.error?.({
      code: ResultCode.Fail,
      message: '未配置平台连接路径',
      data: null
    });

    platformState = {
      ...platformState,
      phase: 'failed',
      lastError: 'missing platform path'
    };

    return Promise.resolve();
  }

  try {
    platformEntryPath = require.resolve(platformPath);
    platformBootstrapPath = require.resolve('../../platform-bootstrap.js');
  } catch (error) {
    logger?.warn?.({
      code: ResultCode.Fail,
      message: '平台连接包未支持 require',
      data: error
    });
    markFailure(error);

    return Promise.resolve();
  }

  if (platformManager?.child && platformManager.child.exitCode === null && !platformManager.child.killed) {
    return Promise.resolve();
  }

  resetBootState();

  const manager: ChildProcessManager = {
    isKilling: false,
    restartRequested: false,
    transportReady: false,
    appReady: false,
    protocolVersion: 'legacy',
    fallbackToImportOnExit: false
  };

  platformManager = manager;

  manager.controlTimer = setTimeout(() => {
    logger?.error?.({
      code: ResultCode.Fail,
      message: '平台连接进程未及时发送 ready，正在重启',
      data: null
    });
    manager.isKilling = true;
    markFailure('control_ready_timeout');

    try {
      manager.child?.kill();
    } catch {
      cleanupManager(manager);
      scheduleRestart('control_ready_timeout');
    }
  }, platformProcessConfig.controlReadyTimeout);

  try {
    manager.child = childProcess.fork(platformBootstrapPath, [], {
      execArgv: process.execArgv,
      env: {
        ...process.env,
        __ALEMON_IPC: '1',
        __ALEMON_PLATFORM_ENTRY: platformEntryPath
      },
      serialization: 'advanced'
    });

    manager.child.on('exit', (code, signal) => {
      const fallbackToImportOnExit = manager.fallbackToImportOnExit;

      cleanupManager(manager);

      if (fallbackToImportOnExit) {
        void startByImport();

        return;
      }

      if (manager.isKilling || manager.restartRequested) {
        scheduleRestart(manager.restartRequested ? 'manual_restart' : 'timeout_or_kill');

        return;
      }

      logger?.warn?.({
        code: ResultCode.Fail,
        message: `平台连接子进程已退出，code=${code}, signal=${signal}，稍后自动重启`,
        data: null
      });
      markFailure(`exit:${code ?? 'null'}:${signal ?? 'null'}`);
      scheduleRestart('unexpected_exit');
    });

    manager.child.on('message', message => {
      try {
        handleMessage(manager, message);
      } catch (error) {
        logger?.error?.({
          code: ResultCode.Fail,
          message: '平台连接进程通信数据格式错误',
          data: error
        });
      }
    });

    manager.child.on('error', error => {
      logger?.error?.({
        code: ResultCode.Fail,
        message: '平台连接子进程发生错误',
        data: error
      });
      platformState = {
        ...platformState,
        lastError: normalizeErrorMessage(error)
      };
    });
  } catch (error) {
    cleanupManager(manager);
    logger?.warn?.({
      code: ResultCode.Fail,
      message: 'fork 启动平台连接失败',
      data: error
    });
    markFailure(error);
    scheduleRestart('fork_error');
  }

  return Promise.resolve();
}
