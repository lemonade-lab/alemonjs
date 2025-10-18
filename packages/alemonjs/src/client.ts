import { cbpClient, loadModels } from './index';
import { defaultPort } from './core/variable';
import { createServer } from './server/main';

// 应用服务器
const mainServer = () => {
  // 只有设置了 serverPort 时才启动应用服务器
  const port = process.env.serverPort;

  if (!port) {
    return;
  }
  createServer(port, () => {
    const httpURL = `http://127.0.0.1:${port}`;

    logger.info(`应用服务器: ${httpURL}`);
  });
};

// 连接 CBP 服务器
const main = () => {
  const login = process.env.login ?? '';
  const platform = process.env.platform ?? '';
  const url = process.env.url ?? '';
  const port = process.env.port ?? defaultPort;
  const isFullReceive = process.env.is_full_receive === 'true' || process.env.is_full_receive === '1';

  // 当 login 和 platform 都没有指定时，且指定了 url，则连接到指定的 url
  if (!login && !platform && url) {
    logger.info(`[Connecting to CBP server at ${url}]`);
    cbpClient(url);
  } else {
    const httpURL = `http://127.0.0.1:${port}`;

    cbpClient(httpURL, { isFullReceive });
  }

  loadModels();
};

const mainProcess = () => {
  ['SIGINT', 'SIGTERM', 'SIGQUIT', 'disconnect'].forEach(sig => {
    process?.on?.(sig, () => {
      logger.info?.(`[alemonjs][${sig}] 收到信号，正在关闭...`);
      setImmediate(() => process.exit(0));
    });
  });

  process?.on?.('exit', code => {
    logger.info?.(`[alemonjs][exit] 进程退出，code=${code}`);
  });

  // 监听主进程消息
  process.on('message', msg => {
    try {
      const data = typeof msg === 'string' ? JSON.parse(msg) : msg;

      if (data?.type === 'start') {
        main();
        // 启动内部服务器
        mainServer();
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
