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
  const curValue = options?.[key] ?? cfg.argv?.[key];
  const value = curValue ?? cfg.value?.[key] ?? defaultValue;

  return value;
};

// 从 cbp 子配置中读取，回退到旧的顶层 key
const createCBPOptionsByKey = (options: StartOptions, key: string, defaultValue: any) => {
  const cfg = getConfig();
  const curValue = options?.[key] ?? cfg.argv?.[key];
  // cbp 子配置优先 > 旧的顶层 key > 默认值
  const cbpValue = cfg.value?.cbp?.[key];
  const topValue = cfg.value?.[key];
  const value = curValue ?? cbpValue ?? topValue ?? defaultValue;

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
    global.__sandbox = true;

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

  // 启动平台连接适配器
  void startPlatformAdapterWithFallback();
};

/**
 * 启动客户端
 */
const startClient = (options: StartOptions) => {
  // 格式化 env 变量
  process.env.input = createOptionsByKey(options, 'input', '');
  process.env.is_full_receive = String(createCBPOptionsByKey(options, 'is_full_receive', true));
  process.env.port = String(createCBPOptionsByKey(options, 'port', '') || '');
  process.env.url = createCBPOptionsByKey(options, 'url', '');
  // 启动模块加载适配器
  startModuleAdapter();
};

/**
 * 启动程序
 * @param input
 */
export const start = (options: StartOptions | string = {}) => {
  if (typeof options === 'string') {
    // 如果是字符串，则认为是入口文件路径
    options = { input: options };
  }

  // 保存全局参数
  global.__options = options;

  // 得到端口号（cbp.port 优先，回退到旧的顶层 port）
  const port = createCBPOptionsByKey(options, 'port', '');

  // 检查 cbp.enable，显式设为 false 时不启动 CBP 服务器
  const cfg = getConfig();
  const cbpEnable = cfg.value?.cbp?.enable;

  // 设置环境变量
  process.env.port = port ? String(port) : '';

  if (port && cbpEnable !== false) {
    // 有端口：启动 CBP WebSocket 服务器（兼容前端 UI 和远程连接）
    cbpServer(port, () => {
      logger.info(`[API mode] http://127.0.0.1:${port}`);
      logger.info(`[WebSocket mode] ws://127.0.0.1:${port}`);

      // 启动客户端进程
      startClient(options);
      // 启动平台进程
      startPlatform(options);
    });
  } else {
    // 无端口：纯 IPC 模式 + 直连通道，不启动 WS 服务器
    const sockPath = generateSocketPath();

    process.env.__ALEMON_DIRECT_SOCK = sockPath;
    logger.info('[Direct-IPC mode] 平台↔客户端直连');

    // 直接启动客户端和平台进程（客户端先启动 UDS 服务端，平台后连接）
    startClient(options);
    // 启动平台进程
    startPlatform(options);
  }
};
