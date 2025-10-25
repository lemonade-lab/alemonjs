import childProcess from 'child_process';
import { ResultCode } from '../core';

import module from 'module';

const initRequire = () => {};

initRequire.resolve = () => '';
const require = module?.createRequire?.(import.meta.url) ?? initRequire;

/**
 * 启动模块加载进程
 * @returns
 */
export function startModuleAdapter() {
  let modulePath = '';

  try {
    modulePath = require.resolve('../client.js');
  } catch (e) {
    logger?.warn?.({
      code: ResultCode.Fail,
      message: '模块加载进程启动失败，尝试使用 fork 模式启动',
      data: e
    });

    return;
  }

  const startByFork = () => {
    let restarted = false;
    let ready = false;
    let child: ReturnType<typeof childProcess.fork> | undefined;

    const restart = () => {
      if (restarted) {
        return;
      }
      restarted = true;
      if (child) {
        child.removeAllListeners();
        try {
          child.kill();
        } catch {}
      }
      setTimeout(() => {
        startByFork();
      }, 3000);
    };

    try {
      // 继承主进程的 execArgv，包括任何自定义的 loader 配置
      child = childProcess.fork(modulePath, [], {
        execArgv: process.execArgv
      });

      // 超时
      const checkTimeout = () => {
        if (!ready) {
          logger?.error?.({
            code: ResultCode.Fail,
            message: '模块加载未及时响应（未发送 ready 消息）',
            data: null
          });
          try {
            child?.kill();
          } catch {
            //
          }
        }
      };

      const timer = setTimeout(() => void checkTimeout(), 2000);

      child.on('exit', (code, signal) => {
        clearTimeout(timer);
        logger?.warn?.({
          code: ResultCode.Fail,
          message: `模块加载子进程已退出，code=${code}, signal=${signal}，3秒后自动重启`,
          data: null
        });
        restart();
      });

      child.on('message', msg => {
        try {
          const data = typeof msg === 'string' ? JSON.parse(msg) : msg;

          if (data?.type === 'ready') {
            ready = true;
            clearTimeout(timer);
            logger?.debug?.({
              code: ResultCode.Ok,
              message: '模块加载已就绪（子进程 fork 模式）',
              data: null
            });
            child?.send?.({ type: 'start' });
          }
        } catch (err) {
          logger?.error?.({
            code: ResultCode.Fail,
            message: '模块加载进程通信数据格式错误',
            data: err
          });
        }
      });
    } catch (err) {
      logger?.warn?.({
        code: ResultCode.Fail,
        message: 'fork 启动模块加载失败',
        data: err
      });
    }
  };

  startByFork();
}
