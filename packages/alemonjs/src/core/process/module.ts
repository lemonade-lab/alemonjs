import childProcess from 'child_process';
import { getConfigValue, ResultCode } from '../../common/index.js';
import module from 'module';
import { setClientChild, forwardFromClient } from './ipc-bridge';
import type { AdapterProtocolVersion, AdapterTransportMode, ProcessAdapterState } from './types';

const initRequire = () => {};

initRequire.resolve = () => '';
const require = module?.createRequire?.(import.meta.url) ?? initRequire;

type ModuleProcessConfig = {
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

let moduleManager: ChildProcessManager | null = null;
let moduleState: ProcessAdapterState = createInitialState();
let moduleProcessConfig: ModuleProcessConfig | null = null;
let moduleProcessPath = '';

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

const normalizeErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === 'string' ? error : 'Unknown process adapter error';
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

const buildConfig = (): ModuleProcessConfig => {
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
  moduleState = {
    ...moduleState,
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
  if (transportMode === 'ipc' && moduleManager?.child) {
    setClientChild(moduleManager.child);
  } else {
    setClientChild(null);
  }
};

const markFailure = (error?: unknown) => {
  moduleState = {
    ...moduleState,
    phase: 'failed',
    lastError: error ? normalizeErrorMessage(error) : moduleState.lastError,
    consecutiveFailures: moduleState.consecutiveFailures + 1
  };
};

const markTransportReady = (transport: AdapterTransportMode, legacyReadyMode = false) => {
  const now = Date.now();

  if (!moduleManager) {
    return;
  }

  moduleManager.transportReady = true;
  clearTimer(moduleManager.transportTimer);
  clearTimer(moduleManager.legacyTransportTimer);
  moduleManager.transportTimer = undefined;
  moduleManager.legacyTransportTimer = undefined;

  moduleState = {
    ...moduleState,
    phase: moduleState.lastAppReadyAt ? 'app_ready' : 'transport_ready',
    transportMode: transport,
    lastTransportReadyAt: now,
    legacyReadyMode,
    consecutiveFailures: 0,
    bootTimings: {
      ...moduleState.bootTimings,
      readyToTransportReadyMs: moduleState.lastReadyAt ? now - moduleState.lastReadyAt : undefined,
      transportReadyToAppReadyMs: moduleState.lastAppReadyAt ? moduleState.lastAppReadyAt - now : moduleState.bootTimings.transportReadyToAppReadyMs
    }
  };

  updateTransportBinding(transport);

  if (legacyReadyMode) {
    debugLog('module adapter fallback to legacy transport ready');
  }
};

const scheduleRestart = (reason: string) => {
  if (!moduleProcessConfig || !moduleProcessPath) {
    return;
  }

  const baseDelay = moduleProcessConfig.restartDelay;
  const delay = Math.min(baseDelay * 2 ** Math.max(moduleState.consecutiveFailures - 1, 0), moduleProcessConfig.maxRestartDelay);

  moduleState = {
    ...moduleState,
    restartCount: moduleState.restartCount + 1
  };

  debugLog('schedule module adapter restart', { reason, delay });

  setTimeout(() => {
    startModuleAdapter();
  }, delay);
};

const cleanupManager = (manager: ChildProcessManager | null) => {
  clearManagerTimers(manager);

  if (manager?.child) {
    manager.child.removeAllListeners();
  }

  setClientChild(null);

  if (moduleManager === manager) {
    moduleManager = null;
  }
};

const handleControlReady = (manager: ChildProcessManager, message: Record<string, unknown>) => {
  const protocolVersion = message.protocolVersion === 'v2' ? 'v2' : 'legacy';
  const now = Date.now();

  manager.protocolVersion = protocolVersion;
  clearTimer(manager.controlTimer);
  manager.controlTimer = undefined;

  moduleState = {
    ...moduleState,
    phase: 'control_ready',
    protocolVersion,
    legacyReadyMode: protocolVersion === 'legacy',
    lastReadyAt: now,
    bootTimings: {
      ...moduleState.bootTimings,
      forkToReadyMs: moduleState.startedAt ? now - moduleState.startedAt : undefined
    }
  };

  manager.child?.send?.({ type: 'start' });

  if (protocolVersion === 'v2') {
    manager.transportTimer = setTimeout(() => {
      logger?.warn?.({
        code: ResultCode.Fail,
        message: '模块加载进程未在规定时间内建立通讯层，正在重启',
        data: null
      });
      manager.isKilling = true;
      markFailure('transport_ready_timeout');

      try {
        manager.child?.kill();
      } catch {
        cleanupManager(manager);
        scheduleRestart('transport_ready_timeout');
      }
    }, moduleProcessConfig?.transportReadyTimeout ?? 15000);

    manager.appTimer = setTimeout(() => {
      logger?.warn?.({
        code: ResultCode.Warn,
        message: '模块加载进程业务初始化较慢，尚未收到 app_ready',
        data: null
      });
    }, moduleProcessConfig?.appReadyTimeout ?? 30000);
  } else {
    const legacyTransportMode: AdapterTransportMode = process.env.__ALEMON_DIRECT_SOCK ? 'direct' : 'ipc';

    manager.legacyTransportTimer = setTimeout(() => {
      if (!manager.transportReady) {
        markTransportReady(legacyTransportMode, true);
      }
    }, moduleProcessConfig?.legacyTransportGraceMs ?? 50);
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

    moduleState = {
      ...moduleState,
      phase: 'app_ready',
      lastAppReadyAt: now,
      bootTimings: {
        ...moduleState.bootTimings,
        transportReadyToAppReadyMs: moduleState.lastTransportReadyAt
          ? now - moduleState.lastTransportReadyAt
          : moduleState.bootTimings.transportReadyToAppReadyMs
      }
    };

    return;
  }

  if (data?.type === 'boot_error') {
    moduleState = {
      ...moduleState,
      lastError: normalizeErrorMessage(data.error?.message ?? data.error)
    };

    logger?.warn?.({
      code: ResultCode.Fail,
      message: `模块加载进程启动阶段失败: ${String(data.stage ?? 'unknown')}`,
      data: data.error ?? null
    });

    return;
  }

  if (data?.type === 'ipc:data') {
    forwardFromClient(data.data);
  }
};

export const getModuleAdapterState = (): ProcessAdapterState => ({
  ...moduleState,
  bootTimings: { ...moduleState.bootTimings }
});

export function restartModuleAdapter(): void {
  if (!moduleManager?.child) {
    startModuleAdapter();

    return;
  }

  if (moduleManager.restartRequested) {
    return;
  }

  moduleManager.restartRequested = true;
  moduleManager.isKilling = true;
  moduleState = {
    ...moduleState,
    phase: 'stopping'
  };
  clearManagerTimers(moduleManager);

  try {
    moduleManager.child.kill();
  } catch {
    cleanupManager(moduleManager);
    scheduleRestart('manual_restart');
  }
}

export function startModuleAdapter(): void {
  moduleProcessConfig = buildConfig();

  try {
    moduleProcessPath = require.resolve('../../client.js');
  } catch (error) {
    logger?.warn?.({
      code: ResultCode.Fail,
      message: '模块加载进程启动失败',
      data: error
    });

    markFailure(error);

    return;
  }

  if (moduleManager?.child && moduleManager.child.exitCode === null && !moduleManager.child.killed) {
    return;
  }

  resetBootState();

  const manager: ChildProcessManager = {
    isKilling: false,
    restartRequested: false,
    transportReady: false,
    appReady: false,
    protocolVersion: 'legacy'
  };

  moduleManager = manager;

  manager.controlTimer = setTimeout(() => {
    logger?.error?.({
      code: ResultCode.Fail,
      message: '模块加载进程未及时发送 ready，正在重启',
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
  }, moduleProcessConfig.controlReadyTimeout);

  try {
    manager.child = childProcess.fork(moduleProcessPath, [], {
      execArgv: process.execArgv,
      env: { ...process.env, __ALEMON_IPC: '1' },
      serialization: 'advanced'
    });

    manager.child.on('exit', (code, signal) => {
      cleanupManager(manager);

      if (manager.isKilling || manager.restartRequested) {
        scheduleRestart(manager.restartRequested ? 'manual_restart' : 'timeout_or_kill');

        return;
      }

      logger?.warn?.({
        code: ResultCode.Fail,
        message: `模块加载子进程已退出，code=${code}, signal=${signal}，稍后自动重启`,
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
          message: '模块加载进程通信数据格式错误',
          data: error
        });
      }
    });

    manager.child.on('error', error => {
      logger?.error?.({
        code: ResultCode.Fail,
        message: '模块加载子进程发生错误',
        data: error
      });
      moduleState = {
        ...moduleState,
        lastError: normalizeErrorMessage(error)
      };
    });
  } catch (error) {
    cleanupManager(manager);
    logger?.warn?.({
      code: ResultCode.Fail,
      message: 'fork 启动模块加载失败',
      data: error
    });
    markFailure(error);
    scheduleRestart('fork_error');
  }
}
