import { readFileSync, existsSync, watch, writeFileSync, mkdirSync, FSWatcher } from 'fs';
import { dirname, join } from 'path';
import YAML from 'yaml';
import type { Package } from '../types';
import { ResultCode } from './variable';

type ConfigValue = { [key: string]: any };
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
