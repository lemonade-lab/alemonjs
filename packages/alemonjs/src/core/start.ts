import { getConfig } from './config.js';
import { cbpServer } from '../cbp/server/main.js';
import { defaultPlatformCommonPrefix, filePrefixCommon } from './variable.js';
import type { StartOptions } from '../types';
import { startPlatformAdapterWithFallback } from '../process/platform.js';
import { startModuleAdapter } from '../process/module.js';
import { generateSocketPath } from '../process/direct-channel.js';

// 得到最恰当的参数
const createOptionsByKey = (options: StartOptions, key: string, defaultValue: any) => {
  const cfg = getConfig();
  const curValue = options?.[key] ?? cfg.argv?.[key];
  const value = curValue ?? cfg.value?.[key] ?? defaultValue;

  return value;
};

/**
 * 启动平台服务
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
 * 启动 alemonjs
 */
export const start = (options: StartOptions | string = {}) => {
  if (typeof options === 'string') {
    options = { input: options };
  }

  global.__options = options;

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

  process.env.port = port ? String(port) : '';
  process.env.serverPort = serverPort;

  if (port) {
    cbpServer(port, () => {
      const httpURL = `http://127.0.0.1:${port}`;
      const wsURL = `ws://127.0.0.1:${port}`;

      logger.info(`[CBP-Server] ${httpURL}`);
      logger.info(`[CBP-Server] ${wsURL}]`);

      startClient(options);
      startPlatform(options);
    });
  } else {
    const sockPath = generateSocketPath();

    process.env.__ALEMON_DIRECT_SOCK = sockPath;
    logger.info('[Direct-IPC] 平台↔客户端直连');

    startClient(options);
    startPlatform(options);
  }
};
