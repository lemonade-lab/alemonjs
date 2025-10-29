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
}

/**
 * 启动模块加载进程
 */
export function startModuleAdapter(): void {
  const values = getConfigValue();
  // 进程配置
  const pro = values?.process ?? {};

  let modulePath = '';

  // 配置常量
  const CONFIG = {
    RESTART_DELAY: pro?.restart_delay ?? 3000,
    FORK_TIMEOUT: pro?.fork_timeout ?? 6000 // 6秒默认超时
  } as const;

  try {
    modulePath = require.resolve('../client.js');
  } catch (error) {
    logger?.warn?.({
      code: ResultCode.Fail,
      message: '模块加载进程启动失败',
      data: error
    });

    return;
  }

  /**
   * 通过 fork 启动模块加载进程
   */
  const startByFork = (): void => {
    const manager: ChildProcessManager = {
      restarted: false,
      ready: false
    };

    /**
     * 清理资源
     */
    const cleanup = (): void => {
      if (manager.timer) {
        clearTimeout(manager.timer);
        manager.timer = undefined;
      }
      if (manager.child) {
        manager.child.removeAllListeners();
      }
    };

    /**
     * 重启子进程
     */
    const restart = (): void => {
      if (manager.restarted) {
        return;
      }

      manager.restarted = true;
      cleanup();

      setTimeout(() => {
        startByFork();
      }, CONFIG.RESTART_DELAY);
    };

    /**
     * 检查超时
     */
    const checkTimeout = (): void => {
      if (!manager.ready) {
        logger?.error?.({
          code: ResultCode.Fail,
          message: '模块加载未及时响应（未发送 ready 消息）',
          data: null
        });

        try {
          manager.child?.kill();
        } catch {
          // 忽略 kill 错误
        }
      }
    };

    try {
      // 继承主进程的 execArgv，包括任何自定义的 loader 配置
      manager.child = childProcess.fork(modulePath, [], {
        execArgv: process.execArgv
      });

      manager.timer = setTimeout(checkTimeout, CONFIG.FORK_TIMEOUT);

      /**
       * 子进程退出处理
       */
      manager.child.on('exit', (code, signal) => {
        cleanup();

        logger?.warn?.({
          code: ResultCode.Fail,
          message: `模块加载子进程已退出，code=${code}, signal=${signal}，${CONFIG.RESTART_DELAY / 1000}秒后自动重启`,
          data: null
        });

        restart();
      });

      /**
       * 子进程消息处理
       */
      manager.child.on('message', (message: unknown) => {
        try {
          const data = typeof message === 'string' ? JSON.parse(message) : message;

          if (data?.type === 'ready') {
            manager.ready = true;
            cleanup();

            logger?.debug?.({
              code: ResultCode.Ok,
              message: '模块加载已就绪（子进程 fork 模式）',
              data: null
            });

            manager.child?.send?.({ type: 'start' });
          }
        } catch (error) {
          logger?.error?.({
            code: ResultCode.Fail,
            message: '模块加载进程通信数据格式错误',
            data: error
          });
        }
      });

      /**
       * 子进程错误处理
       */
      manager.child.on('error', error => {
        logger?.error?.({
          code: ResultCode.Fail,
          message: '模块加载子进程发生错误',
          data: error
        });

        // 错误事件也会触发 exit 事件，所以这里不需要额外处理重启
      });
    } catch (error) {
      logger?.warn?.({
        code: ResultCode.Fail,
        message: 'fork 启动模块加载失败',
        data: error
      });

      // fork 失败后延迟重启
      setTimeout(() => {
        startByFork();
      }, CONFIG.RESTART_DELAY);
    }
  };

  startByFork();
}
