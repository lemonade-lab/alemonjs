import { logger, shutdownLogger } from '../common/logger.js';

type Options = {
  /**
   * 注册入口
   * @returns
   */
  main: () => any;
  /**
   * 平台名称，用于日志标识
   */
  name?: string;
};

export const definePlatform = (options: Options) => {
  const platformName = options.name || process.env.platform || 'unknown';

  if (global.__platform_bootstrap_loaded) {
    return options.main;
  }

  // 开始注册子进程交互
  const mainProcess = () => {
    let stopping = false;
    const shutdown = async (reason: string) => {
      if (stopping) {
        return;
      }

      stopping = true;
      logger.info?.(`[${platformName}][${reason}] 收到信号，正在关闭...`);
      await shutdownLogger();
      process.exit(0);
    };

    ['SIGINT', 'SIGTERM', 'SIGQUIT', 'disconnect'].forEach(sig => {
      process?.on?.(sig, () => {
        void shutdown(sig);
      });
    });

    process?.once?.('beforeExit', code => {
      logger.info?.(`[${platformName}][exit] 进程退出，code=${code}`);
      void shutdownLogger();
    });

    // 监听主进程消息
    process.on('message', msg => {
      try {
        const data = typeof msg === 'string' ? JSON.parse(msg) : msg;

        if (data?.type === 'start') {
          options.main();
        } else if (data?.type === 'stop') {
          void shutdown('stop');
        }
      } catch {}
    });

    // 主动发送 ready 消息
    if (process.send) {
      process.send(JSON.stringify({ type: 'ready' }));
    }
  };

  // 仅当作为平台进程入口加载时才执行 mainProcess，
  if (!global.__client_loaded) {
    mainProcess();
  }

  // 这里是旧兼容性返回
  return options.main;
};
