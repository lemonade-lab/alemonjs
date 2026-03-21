import { readFileSync, existsSync, watch, writeFileSync, mkdirSync, FSWatcher } from 'fs';
import { dirname, join } from 'path';
import YAML from 'yaml';
import type { Package } from '../types';
import { ResultCode } from './variable';

type ConfigValue = {
  [key: string]: any;
  /** 平台连接包路径 */
  platform?: string;
  /** 登录标识 */
  login?: string;
  /** 输入目录 */
  input?: string;
  /** 输出目录 */
  output?: string;
  /** 应用模块列表 */
  apps?:
    | string[]
    | {
        [appName: string]:
          | {
              [key: string]: any;
            }
          | boolean;
      };
  /** 启动插件模块 */
  apps_plugins?: {
    [moduleName: string]:
      | {
          /** 是否启用，默认 true */
          enable?: boolean;
          [key: string]: any;
        }
      | boolean;
  };
  /** 进程配置 */
  process?: {
    restart_delay?: number;
    fork_timeout?: number;
    fork_restart_delay?: number;
  };
  /** 消息处理器配置 */
  processor?: {
    repeated_event_time?: number;
    repeated_user_time?: number;
  };
  /** 日志配置 */
  logs?: {
    channel_id?: string[];
  };
  /** 管理员用户 ID */
  master_id?: { [key: string]: boolean };
  /** 管理员用户 Key */
  master_key?: { [key: string]: boolean };
  /** 机器人 ID */
  bot_id?: { [key: string]: boolean };
  /** 机器人 Key */
  bot_key?: { [key: string]: boolean };
  /** 禁用文本正则 */
  disabled_text_regular?: string;
  /** 禁用选择器 */
  disabled_selects?: { [key: string]: boolean };
  /** 禁用用户 ID */
  disabled_user_id?: { [key: string]: boolean };
  /** 禁用用户 Key */
  disabled_user_key?: { [key: string]: boolean };
  /** 重定向正则（别名） */
  redirect_regular?: string;
  /** 重定向文本正则 */
  redirect_text_regular?: string;
  /** 重定向目标（别名） */
  redirect_target?: string;
  /** 重定向文本目标 */
  redirect_text_target?: string;
  /** 文本映射规则 */
  mapping_text?: { regular?: string; target?: string }[];
  /** @deprecated 请使用 cbp.port */
  port?: number | string;
  /** @deprecated 请使用 cbp.url */
  url?: string;
  /** @deprecated 请使用 cbp.is_full_receive */
  is_full_receive?: boolean;
  /** CBP 服务器配置 */
  cbp?: {
    /** 是否启用 CBP 服务器，默认 true（配置了 port 时） */
    enable?: boolean;
    /** CBP 服务器端口 */
    port?: number | string;
    /** CBP 远程连接地址 */
    url?: string;
    /** 是否全量接收消息 */
    is_full_receive?: boolean;
    /** CBP 应用插件，key 为包名，value 为配置 */
    apps?: {
      [packageName: string]:
        | {
            /** WS 路由路径，默认取包名最后一段 */
            path?: string;
            /** 是否启用，默认 true */
            enable?: boolean;
          }
        | boolean;
    };
  };
  /**
   * 核心运行时状态
   * @deprecated 设计已废弃
   */
  core?: {
    state?: string[];
    [key: string]: any;
  };
};
type ConfigListener<T extends ConfigValue = ConfigValue> = (value: T) => void;

/**
 * 配置类
 */
class ConfigCore<T extends ConfigValue = ConfigValue> {
  #value: T | null = null;

  // 缓存合并后的值，避免每次 get value 都重新合并
  #mergedValue: T | null = null;

  // 保存 watcher 引用，防止重复注册
  #watcher: FSWatcher | null = null;

  // 订阅者集合
  #listeners = new Set<ConfigListener<T>>();

  // 防抖定时器
  #debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // 防抖延迟 (ms)
  #debounceDelay = 100;

  // 缓存 argv proxy，避免每次创建新实例
  #argvProxy: { [key: string]: string | null | undefined } | null = null;

  // 缓存解析后的绝对路径
  #resolvedDir: string | null = null;

  #initValue: T = {} as T;

  constructor(dir: string) {
    this.#resolvedDir = join(process.cwd(), dir);
  }

  /**
   * 使合并缓存失效
   */
  #invalidateMergedCache() {
    this.#mergedValue = null;
  }

  /**
   * 从磁盘读取并解析配置文件
   */
  #readConfig(): T | null {
    if (!this.#resolvedDir) {
      return null;
    }
    try {
      const data = readFileSync(this.#resolvedDir, 'utf-8');

      return YAML.parse(data) as T;
    } catch (err) {
      logger.error({
        code: ResultCode.FailInternal,
        message: 'Config file parse error',
        data: err
      });

      return null;
    }
  }

  /**
   * 更新内存中的配置值并使缓存失效
   */
  #applyValue(newValue: T | null) {
    if (newValue === null) {
      return;
    }
    this.#value = newValue;
    this.#invalidateMergedCache();
  }

  /**
   * 通知所有订阅者（带防抖）
   */
  #notifyListeners() {
    if (this.#debounceTimer) {
      clearTimeout(this.#debounceTimer);
    }
    this.#debounceTimer = setTimeout(() => {
      this.#debounceTimer = null;

      const val = this.value;

      if (!val) {
        return;
      }
      for (const listener of this.#listeners) {
        try {
          listener(val);
        } catch (err) {
          logger.error({
            code: ResultCode.FailInternal,
            message: 'Config listener error',
            data: err
          });
        }
      }
    }, this.#debounceDelay);
  }

  /**
   * 启动文件监听（仅一次）
   */
  #ensureWatcher() {
    if (this.#watcher || !this.#resolvedDir) {
      return;
    }
    if (!existsSync(this.#resolvedDir)) {
      return;
    }

    this.#watcher = watch(this.#resolvedDir, () => {
      const newValue = this.#readConfig();

      if (newValue !== null) {
        this.#applyValue(newValue);
        this.#notifyListeners();
      }
    });
  }

  /**
   * 初始化：读取配置 + 启动监听
   */
  #init() {
    if (!this.#resolvedDir) {
      return;
    }

    if (!existsSync(this.#resolvedDir)) {
      this.saveValue(this.#initValue);

      return;
    }

    this.#applyValue(this.#readConfig());
    this.#ensureWatcher();
  }

  /**
   * 当且仅当配置文件存在时
   */
  get value(): T | null {
    if (!this.#value) {
      this.#init();
    }
    if (this.#mergedValue) {
      return this.#mergedValue;
    }
    this.#mergedValue = {
      ...(this.#value || {}),
      ...(global?.__options || {})
    } as T;

    return this.#mergedValue;
  }

  /**
   * 保存配置值到磁盘并同步内存
   */
  saveValue(value: T) {
    if (!this.#resolvedDir) {
      return;
    }

    const dirPath = dirname(this.#resolvedDir);

    if (!existsSync(this.#resolvedDir)) {
      mkdirSync(dirPath, { recursive: true });
    }

    const data = YAML.stringify(value);

    writeFileSync(this.#resolvedDir, data, 'utf-8');

    // 同步更新内存值
    this.#applyValue(value);

    // 确保 watcher 已启动（首次 saveValue 创建文件后）
    this.#ensureWatcher();
  }

  /**
   * 注册配置变更监听器
   * @returns 取消订阅函数
   */
  onWatch(listener: ConfigListener<T>): () => void {
    this.#listeners.add(listener);

    // 确保 watcher 已启动
    if (!this.#value) {
      this.#init();
    } else {
      this.#ensureWatcher();
    }

    return () => {
      this.#listeners.delete(listener);
    };
  }

  /**
   * 销毁实例，释放资源
   */
  dispose() {
    if (this.#watcher) {
      this.#watcher.close();
      this.#watcher = null;
    }
    if (this.#debounceTimer) {
      clearTimeout(this.#debounceTimer);
      this.#debounceTimer = null;
    }
    this.#listeners.clear();
  }

  #package: Package | null = null;

  /**
   * package.json
   */
  get package(): Package | null {
    if (this.#package) {
      return this.#package;
    }

    const dir = process.env.PKG_PATH || join(process.cwd(), 'package.json');

    if (!existsSync(dir)) {
      logger.warn({
        code: ResultCode.FailInternal,
        message: 'package.json not found',
        data: null
      });

      return null;
    }

    try {
      const data = readFileSync(dir, 'utf-8');

      this.#package = JSON.parse(data);
    } catch (err) {
      logger.error({
        code: ResultCode.FailInternal,
        message: 'package.json parse error',
        data: err
      });

      return null;
    }

    return this.#package;
  }

  /**
   * 命令行参数，
   * ****
   * 获取 --name value
   * ****
   * 例：argv.login == 'gui'
   */
  get argv() {
    if (this.#argvProxy) {
      return this.#argvProxy;
    }

    this.#argvProxy = new Proxy({} as { [key: string]: string | null | undefined }, {
      get(_target, key) {
        if (typeof key === 'symbol') {
          return undefined;
        }

        const index$0 = process.argv.indexOf(key);

        if (index$0 !== -1) {
          return process.argv[index$0 + 1];
        }

        const index = process.argv.indexOf(`--${key}`);

        if (index !== -1) {
          return process.argv[index + 1];
        }

        return null;
      }
    });

    return this.#argvProxy;
  }
}

/**
 * @returns
 */
export const getConfig = <T extends ConfigValue = ConfigValue>(): ConfigCore<T> => {
  if (global?.__config) {
    return global.__config as ConfigCore<T>;
  }
  const configDir = process.env.CFG_PATH || 'alemon.config.yaml';

  global.__config = new ConfigCore<T>(configDir);

  return global.__config as ConfigCore<T>;
};

/**
 * @returns
 */
export const getConfigValue = <T extends ConfigValue = ConfigValue>(): T => {
  return (getConfig<T>()?.value || {}) as T;
};

/**
 * 监听配置文件变更
 * @param callback 配置变更时的回调，参数为新的配置值
 * @returns 取消订阅函数
 */
export const onWatchConfigValue = <T extends ConfigValue = ConfigValue>(callback: ConfigListener<T>): (() => void) => {
  return getConfig<T>().onWatch(callback);
};
