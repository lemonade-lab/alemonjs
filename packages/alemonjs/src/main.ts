import { getConfig, getConfigValue } from './core/config.js';
import { loadChildren, loadChildrenFile } from './app/load.js';
import { getInputExportPath } from './core/utils.js';
import { join } from 'path';
import { existsSync } from 'fs';
import { cbpServer } from './cbp/server.js';
import { defaultPlatformCommonPrefix, defaultPort, filePrefixCommon, ResultCode } from './core/variable.js';
import { cbpClient } from './cbp/client.js';
import { startAdapterWithFallback } from './adapter.js';
import { useState } from './app/hook-use-state.js';

const loadState = () => {
  const value = getConfigValue() ?? {};
  const state = value?.core?.state ?? [];

  for (const name of state) {
    useState(name, false);
  }
};

const loadApps = () => {
  const cfg = getConfig();

  const apps = Array.isArray(cfg.value?.apps) ? cfg.value.apps : Object.keys(cfg.value?.apps ?? {}).filter(Boolean);

  // 去重
  const uniqueApps = Array.from(new Set(apps));

  void Promise.all(uniqueApps.map(app => loadChildrenFile(app)));
};

type ServerOptions = {
  /**
   * @description 服务器端口
   */
  port?: number;
};

type ClientOptions = {
  /**
   * @description 连接到 CBP 服务器的 URL
   */
  url?: string;
};

type StartOptions = ServerOptions &
  ClientOptions & {
    /**
     * @description 入口文件路径
     */
    input?: string;
    /**
     * @description 平台名称
     */
    platform?: string;
    /**
     * @description 登录名
     */
    login?: string;
    /**
     * @description 是否全量接收
     */
    is_full_receive?: boolean;
  };

/**
 * @description 运行本地模块
 * @param input
 * @returns
 */
export const run = (input: string) => {
  if (!input) {
    return;
  }
  const mainPath = join(process.cwd(), input);

  // 路径
  if (!existsSync(input)) {
    logger.warn({
      code: ResultCode.Warn,
      message: '未找到主要入口文件',
      data: null
    });

    return;
  }
  // 指定运行的，name识别为 'main:res:xxx'
  void loadChildren(mainPath, 'main');
};

/**
 * @param input
 */
export const start = (options: StartOptions | string = {}) => {
  if (typeof options === 'string') {
    // 如果是字符串，则认为是入口文件路径
    options = { input: options };
  }
  // 注入配置。
  loadState();
  const cfg = getConfig();

  // 临时参数
  const curURL = options?.url ?? cfg.argv?.url;
  // 临时参数
  const curLogin = options?.login ?? cfg.argv?.login;
  // 临时参数
  const curPlatform = options?.platform ?? cfg.argv?.platform;

  const url = curURL ?? cfg.value?.url;

  if (curURL) {
    logger.info(`[Connecting to CBP server at ${curURL}]`);
    cbpClient(curURL);
  } else if (!curLogin && !curPlatform && url) {
    logger.info(`[Connecting to CBP server at ${url}]`);
    cbpClient(url);
  } else {
    // 创建 cbp 服务器
    const curPort = options?.port ?? cfg.argv?.port;
    const port = curPort ?? cfg.value?.port ?? defaultPort;

    // 设置环境变量
    process.env.port = port;

    cbpServer(port, () => {
      const httpURL = `http://127.0.0.1:${port}`;
      const wsURL = `ws://127.0.0.1:${port}`;

      logger.info(`[CBP server started at ${httpURL}]`);
      logger.info(`[CBP server started at ${wsURL}]`);

      const curIsFullReceive = options?.is_full_receive ?? cfg.argv?.is_full_receive;
      // 是否全量接收
      const isFullReceive = curIsFullReceive ?? cfg.value?.is_full_receive ?? true;

      cbpClient(httpURL, { isFullReceive });

      // 加载平台服务
      const platform = curPlatform ?? cfg.value?.platform;
      const login = curLogin ?? cfg.value?.login;

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

      startAdapterWithFallback();
    });
  }

  // 获取入口文件
  const curInput = options?.input ?? cfg.argv?.input;
  const input = curInput ?? cfg.value?.input ?? getInputExportPath();

  process.env.input = input;

  // 运行本地模块
  run(input);

  // load module
  loadApps();
};
