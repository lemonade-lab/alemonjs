import { fork } from 'child_process';
import { createRequire } from 'module';
import { existsSync } from 'fs';
import { join } from 'path';

const require = createRequire(import.meta.url);

/**
 * 启动平台连接进程，优先 fork，失败后降级为 import
 * @returns
 */
export function startPlatformAdapterWithFallback() {
  let modulePath = '';

  try {
    modulePath = require.resolve(process.env.platform);
  } catch {
    void import(process.env.platform).then(res => res?.default());
    logger?.warn?.('平台连接包未支持 require，降级为 import 加载, 请升级对应的平台连接包以提高进程稳定性');

    return;
  }
  let imported = false; // 标记 import 是否已成功，避免重复

  const startByFork = () => {
    if (imported) {
      return; // 如果已经 import 成功，不再 fork
    }

    let restarted = false;
    let ready = false;
    let child: ReturnType<typeof fork> | undefined;

    const restart = () => {
      if (restarted || imported) {
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
      const checkTimeout = async () => {
        if (!ready && !imported) {
          logger?.warn?.('平台连接未及时响应（未发送 ready 消息），降级为 import 加载, 请升级对应的平台连接包以提高进程稳定性');
          try {
            child?.kill();
          } catch {}
          await startByImport();
        }
      };

      const timer = setTimeout(() => void checkTimeout(), 2000);

      child.on('exit', (code, signal) => {
        clearTimeout(timer);
        if (!imported) {
          logger?.warn?.(`平台连接子进程已退出，code=${code}, signal=${signal}，3秒后自动重启`);
          restart();
        }
      });

      child.on('message', msg => {
        try {
          const data = typeof msg === 'string' ? JSON.parse(msg) : msg;

          if (data?.type === 'ready') {
            ready = true;
            clearTimeout(timer);
            logger?.debug?.('平台连接已就绪（子进程 fork 模式）');
            child?.send?.({ type: 'start' });
          }
        } catch (err) {
          logger?.error?.('平台连接进程通信数据格式错误', err);
        }
      });
    } catch (err) {
      logger?.warn?.('fork 启动平台连接失败，将尝试 import 加载', err);
      void startByImport();
    }
  };

  const startByImport = async () => {
    if (imported) {
      return;
    }
    imported = true;
    try {
      let importPath = modulePath;

      if (!importPath.startsWith('file://')) {
        importPath = 'file://' + importPath;
      }
      const mod = await import(importPath);

      if (typeof mod.default === 'function') {
        await mod.default();
        logger?.debug?.('通过 import 启动平台连接完成');
      } else {
        logger?.warn?.('通过 import 启动平台连接，但未找到默认导出函数');
      }
    } catch (err) {
      logger?.error?.('import 启动平台连接失败', err);
    }
  };

  startByFork();
}
