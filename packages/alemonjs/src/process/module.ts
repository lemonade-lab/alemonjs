import { fork } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/**
 * 启动模块加载进程
 * @returns
 */
export function startModuleAdapter() {
  let modulePath = '';

  try {
    modulePath = require.resolve('../client.js');
  } catch {
    logger?.warn?.('模块进程执行失败...');

    return;
  }

  const startByFork = () => {
    let restarted = false;
    let ready = false;
    let child: ReturnType<typeof fork> | undefined;

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
      child = fork(modulePath, [], {
        execArgv: process.execArgv
      });

      // 超时
      const checkTimeout = () => {
        if (!ready) {
          logger?.warn?.('模块加载未及时响应（未发送 ready 消息）');
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
        logger?.warn?.(`模块加载子进程已退出，code=${code}, signal=${signal}，3秒后自动重启`);
        restart();
      });

      child.on('message', msg => {
        try {
          const data = typeof msg === 'string' ? JSON.parse(msg) : msg;

          if (data?.type === 'ready') {
            ready = true;
            clearTimeout(timer);
            logger?.debug?.('模块加载已就绪（子进程 fork 模式）');
            child?.send?.({ type: 'start' });
          }
        } catch (err) {
          logger?.error?.('模块加载进程通信数据格式错误', err);
        }
      });
    } catch (err) {
      logger?.warn?.('fork 启动模块加载失败', err);
    }
  };

  startByFork();
}
