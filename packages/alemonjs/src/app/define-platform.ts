type Options = {
  /**
   * 注册入口
   * @returns
   */
  main: () => any;
};

export const definePlatform = (options: Options) => {
  // 开始注册子进程交互
  const mainProcess = () => {
    ['SIGINT', 'SIGTERM', 'SIGQUIT', 'disconnect'].forEach(sig => {
      process?.on?.(sig, () => {
        logger.info?.(`[@alemonjs/qq-bot][${sig}] 收到信号，正在关闭...`);
        setImmediate(() => process.exit(0));
      });
    });

    process?.on?.('exit', code => {
      logger.info?.(`[@alemonjs/qq-bot][exit] 进程退出，code=${code}`);
    });

    // 监听主进程消息
    process.on('message', msg => {
      try {
        const data = typeof msg === 'string' ? JSON.parse(msg) : msg;

        if (data?.type === 'start') {
          options.main();
        } else if (data?.type === 'stop') {
          process.exit(0);
        }
      } catch {}
    });

    // 主动发送 ready 消息
    if (process.send) {
      process.send(JSON.stringify({ type: 'ready' }));
    }
  };

  mainProcess();

  // 这里是旧兼容性返回
  return options.main;
};
