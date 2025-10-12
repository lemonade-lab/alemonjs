import { getConfig } from './core/config.js';
import { cbpServer } from './cbp/server/main.js';
import { defaultPlatformCommonPrefix, defaultPort, filePrefixCommon } from './core/variable.js';
import type { StartOptions } from './types';
import { startPlatformAdapterWithFallback } from './process/platform.js';
import { startModuleAdapter } from './process/module.js';

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
  // 得到平台和登录名
  const platform = createOptionsByKey(options, 'platform', '');
  const login = createOptionsByKey(options, 'login', '');

  // 不登录平台
  if (!platform && !login) {
    // 没有指定平台和登录名，则启动 sandbox 模式
    global.sandbox = true;

    return;
  }

  // 如果存在
  if (platform) {
    const reg = filePrefixCommon;

    if (reg.test(platform)) {
      process.env.platform = platform;
      // 剪切
      process.env.login = platform.replace(reg, '');
    } else {
      process.env.platform = platform;
      // 不是执行前缀。则platform 和 login 相同。
      process.env.login = platform;
    }
  } else {
    // 如果没有指定平台，则使用登录名作为平台
    process.env.platform = `${defaultPlatformCommonPrefix}${login}`;
    process.env.login = login;
  }

  // 设置了 login。强制指定
  if (login) {
    process.env.login = login;
  }

  startPlatformAdapterWithFallback();
};

/**
 * 启动客户端
 */
const startClient = (options: StartOptions) => {
  process.env.input = createOptionsByKey(options, 'input', '');
  process.env.output = createOptionsByKey(options, 'output', '');
  process.env.is_full_receive = String(createOptionsByKey(options, 'is_full_receive', true));
  process.env.port = String(createOptionsByKey(options, 'port', defaultPort));
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

  // 得到端口号
  const port = createOptionsByKey(options, 'port', defaultPort);

  // 设置环境变量
  process.env.port = port;

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
};
