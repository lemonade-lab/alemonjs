import { cbpClient, getConfigValue, loadModels } from '../index';
import { defaultPort } from '../core/variable';
import { logger } from '../store/store';

// 标记当前为客户端进程，防止 definePlatform 被 import 时的副作用
global.__client_loaded = true;

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
  // unhandledRejection 捕获未处理的 Promise 拒绝，记录后继续运行，不退出进程
  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('[unhandledRejection] 未捕获的 Promise 拒绝:', reason);
  });

  // uncaughtException 捕获未捕获的异常，记录后继续运行，不退出进程
  process.on('uncaughtException', (error: Error) => {
    logger.error('[uncaughtException] 未捕获的异常:', error);
  });

  // ==================== 信号处理 ====================
  ['SIGINT', 'SIGTERM', 'SIGQUIT', 'disconnect'].forEach(sig => {
    process?.on?.(sig, () => {
      logger.info?.(`[alemonjs][${sig}] 收到信号，正在关闭...`);
      setImmediate(() => process.exit(0));
    });
  });

  // 监听进程退出事件，记录退出码
  process?.on?.('exit', code => {
    logger.info?.(`[alemonjs][exit] 进程退出，code=${code}`);
  });

  // 监听来自主进程的消息，处理启动和停止命令
  process.on('message', msg => {
    try {
      const data = typeof msg === 'string' ? JSON.parse(msg) : msg;

      if (data?.type === 'start') {
        main();

        const values = getConfigValue() || {};
        const startOptions = values.apps_plugins || {};

        // start 插件。在apps进程启动中使用
        for (const key in startOptions) {
          const moduleOptions = startOptions[key];

          // 检查 enable 字段，显式设为 false 时跳过
          if (typeof moduleOptions === 'object' && moduleOptions?.enable === false) {
            continue;
          }

          void import(key).then(mod => {
            if (mod?.default) {
              mod.default(moduleOptions);
            }
          });
        }
      } else if (data?.type === 'stop') {
        process.exit(0);
      }
    } catch {
      //
    }
  });

  // 主动发送 ready 消息（serialization: 'advanced' 直接发送对象，无需 JSON.stringify）
  if (process.send) {
    process.send({ type: 'ready' });
  }
};

mainProcess();
