import childProcess from 'child_process';
import { getConfigValue, ResultCode } from '../core';
import module from 'module';

// 初始化 require 的备用实现
const initRequire = () => {};

initRequire.resolve = () => '';
const require = module?.createRequire?.(import.meta.url) ?? initRequire;

// 子进程管理接口
interface ChildProcessManager {
  child?: childProcess.ChildProcess;
  restarted: boolean;
  ready: boolean;
  timer?: NodeJS.Timeout;
  isKilling: boolean; // 新增：标记是否正在主动杀死进程
}

/**
 * 启动平台连接进程，优先 fork，失败后降级为 import
 */
export function startPlatformAdapterWithFallback(): Promise<void> {
  const values = getConfigValue();
  // 进程配置
  const pro = values?.process ?? {};

  // 配置常量
  const CONFIG = {
    // 重启延迟时间
    RESTART_DELAY: pro?.restart_delay ?? 3000,
    // 定时器，等待子进程 ready 消息的时间
    FORK_TIMEOUT: pro?.fork_timeout ?? 6000,
    // 重新启动延迟时间
    FORK_RESTART_DELAY: pro?.fork_restart_delay ?? 5000
  } as const;

  const platformPath = process.env.platform;

  if (!platformPath) {
    logger?.error?.({
      code: ResultCode.Fail,
      message: '未配置平台连接路径',
      data: null
    });

    return;
  }

  let modulePath = '';
  let isForkFailed = false;
  let imported = false;

  try {
    // 尝试解析模块路径
    modulePath = require.resolve(platformPath);
  } catch {
    // 无法解析路径，直接使用 import
    logger?.warn?.({
      code: ResultCode.Fail,
      message: '平台连接包未支持 require',
      data: null
    });

    return;
  }

  /**
   * 通过 import 启动平台连接
   */
  const startByImport = async (): Promise<void> => {
    if (imported) {
      return;
    }

    imported = true;
    isForkFailed = true; // 标记 fork 失败，阻止后续 fork 尝试

    try {
      // 确保路径格式正确
      const importPath = modulePath.startsWith('file://') ? modulePath : `file://${modulePath}`;
      const mod = await import(importPath);

      if (typeof mod.default === 'function') {
        await mod.default();
        logger?.debug?.({
          code: ResultCode.Ok,
          message: '通过 import 启动平台连接完成',
          data: null
        });
      } else {
        logger?.warn?.({
          code: ResultCode.Fail,
          message: '通过 import 启动平台连接，但未找到默认导出函数',
          data: null
        });
      }
    } catch (error) {
      logger?.error?.({
        code: ResultCode.Fail,
        message: 'import 启动平台连接失败',
        data: error
      });
    }
  };

  /**
   * 通过 fork 启动子进程
   */
  const startByFork = (): void => {
    if (imported) {
      return;
    }
    if (isForkFailed) {
      return;
    }

    const manager: ChildProcessManager = {
      restarted: false,
      ready: false,
      isKilling: false // 初始化标记
    };

    const cleanup = (): void => {
      if (manager.timer) {
        clearTimeout(manager.timer);
        manager.timer = undefined;
      }
      if (manager.child) {
        manager.child.removeAllListeners();
      }
    };

    const restart = (): void => {
      if (manager.restarted || imported) {
        return;
      }

      manager.restarted = true;
      cleanup();

      // 延迟重启
      setTimeout(() => {
        if (!imported && !isForkFailed) {
          startByFork();
        }
      }, CONFIG.RESTART_DELAY);
    };

    const handleForkFailure = (error?: unknown): void => {
      if (imported) {
        return;
      }

      isForkFailed = true; // 标记 fork 失败
      cleanup();

      logger?.warn?.({
        code: ResultCode.Fail,
        message: 'fork 启动平台连接失败，将尝试 import 加载',
        data: error
      });

      void startByImport();
    };

    const checkTimeout = (): void => {
      if (!manager.ready && !imported) {
        logger?.warn?.({
          code: ResultCode.Fail,
          message: '平台连接未及时响应（未发送 ready 消息），降级为 import 加载, 请升级对应的平台连接包以提高进程稳定性',
          data: null
        });

        manager.isKilling = true; // 标记主动杀死
        try {
          manager.child?.kill();
        } catch {
          // 忽略 kill 错误
        }

        handleForkFailure();
      }
    };

    try {
      // 创建子进程，继承主进程的 execArgv
      manager.child = childProcess.fork(modulePath, [], {
        execArgv: process.execArgv
      });

      // 设置超时检查
      manager.timer = setTimeout(checkTimeout, CONFIG.FORK_TIMEOUT);

      // 子进程退出处理
      manager.child.on('exit', (code, signal) => {
        cleanup();

        // 如果是主动杀死的进程，不进行重启
        if (manager.isKilling) {
          return;
        }

        if (!imported) {
          logger?.warn?.({
            code: ResultCode.Fail,
            message: `平台连接子进程已退出，code=${code}, signal=${signal}，${CONFIG.FORK_RESTART_DELAY / 1000}秒后自动重启`,
            data: null
          });
          restart();
        }
      });

      // 子进程消息处理
      manager.child.on('message', (message: unknown) => {
        try {
          const data = typeof message === 'string' ? JSON.parse(message) : message;

          if (data?.type === 'ready') {
            manager.ready = true;

            if (manager.timer) {
              clearTimeout(manager.timer);
              manager.timer = undefined;
            }

            logger?.debug?.({
              code: ResultCode.Ok,
              message: '平台连接已就绪（子进程 fork 模式）',
              data: null
            });

            manager.child?.send?.({ type: 'start' });
          }
        } catch (error) {
          logger?.error?.({
            code: ResultCode.Fail,
            message: '平台连接进程通信数据格式错误',
            data: error
          });
        }
      });

      // 子进程错误处理
      manager.child.on('error', error => {
        handleForkFailure(error);
      });
    } catch (error) {
      handleForkFailure(error);
    }
  };

  // 启动 fork 进程
  startByFork();
}
