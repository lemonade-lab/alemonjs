import { getConfig } from './core/config.js';
import { cbpServer } from './cbp/server/main.js';
import { defaultPlatformCommonPrefix, filePrefixCommon } from './core/variable.js';
import type { StartOptions } from './types';
import { startPlatformAdapterWithFallback } from './process/platform.js';
import { startModuleAdapter } from './process/module.js';
import { generateSocketPath } from './process/direct-channel.js';

// 得到最恰当的参数
const createOptionsByKey = (options: StartOptions, key: string, defaultValue: any) => {
  const cfg = getConfig();
  // 创建 cbp 服务器
  const curValue = options?.[key] ?? cfg.argv?.[key];
  const value = curValue ?? cfg.value?.[key] ?? defaultValue;

  return value;
};

/**
 * 启动平台服务
 * @returns
 */
const startPlatform = (options: StartOptions) => {
  const platform = createOptionsByKey(options, 'platform', '');
  const login = createOptionsByKey(options, 'login', '');

  if (!platform && !login) {
    global.__sandbox = true;

    return;
  }
  void startPlatformAdapterWithFallback();
};

/**
 * 启动客户端
 */
const startClient = (options: StartOptions) => {
  process.env.input = createOptionsByKey(options, 'input', '');
  process.env.output = createOptionsByKey(options, 'output', '');
  process.env.is_full_receive = String(createOptionsByKey(options, 'is_full_receive', true));
  process.env.port = String(createOptionsByKey(options, 'port', '') || '');
  process.env.url = createOptionsByKey(options, 'url', '');

  startModuleAdapter();
};

/**
 * @param input
 */
export const start = (options: StartOptions | string = {}) => {
  if (typeof options === 'string') {
    // 如果是字符串，则认为是入口文件路径
    options = { input: options };
  }

  // 保存全局参数
  global.__options = options;

  // 得到端口号（传空字符串或 0 表示不启动 WS）
  const port = createOptionsByKey(options, 'port', '');
  const serverPort = createOptionsByKey(options, 'serverPort', '');
  const platform = createOptionsByKey(options, 'platform', '');
  const login = createOptionsByKey(options, 'login', '');

  if (platform) {
    const reg = filePrefixCommon;

    if (reg.test(platform)) {
      process.env.platform = platform;
      process.env.login = platform.replace(reg, '');
    } else {
      process.env.platform = platform;
      process.env.login = platform;
    }
  } else if (login) {
    process.env.platform = `${defaultPlatformCommonPrefix}${login}`;
    process.env.login = login;
  }

  // 设置环境变量
  process.env.port = port ? String(port) : '';
  process.env.serverPort = serverPort;

  if (port) {
    // 有端口：启动 CBP WebSocket 服务器（兼容前端 UI 和远程连接）
    cbpServer(port, () => {
      const httpURL = `http://127.0.0.1:${port}`;
      const wsURL = `ws://127.0.0.1:${port}`;

      logger.info(`[CBP server started at ${httpURL}]`);
      logger.info(`[CBP server started at ${wsURL}]`);

      // 启动客户端进程
      startClient(options);

      // 启动平台进程
      startPlatform(options);
    });
  } else {
    // 无端口：纯 IPC 模式 + 直连通道，不启动 WS 服务器
    const sockPath = generateSocketPath();

    process.env.__ALEMON_DIRECT_SOCK = sockPath;
    logger.info('[Direct-IPC mode] 平台↔客户端直连通道，无主进程桥接');

    // 直接启动客户端和平台进程（客户端先启动 UDS 服务端，平台后连接）
    startClient(options);
    startPlatform(options);
  }
};
