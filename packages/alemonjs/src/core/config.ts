import { readFileSync, existsSync, watch, writeFileSync, mkdirSync, FSWatcher } from 'fs';
import { dirname, join } from 'path';
import YAML from 'yaml';
import type { Package } from '../types';
import { ResultCode } from './variable';

/**
 * 配置类
 */
export class ConfigCore {
  //
  #dir: string | null = null;

  #value: any = null;

  // 缓存合并后的值，避免每次 get value 都重新合并
  #mergedValue: any = null;

  // 保存 watcher 引用，防止重复注册
  #watcher: FSWatcher | null = null;

  #initValue = {
    gui: {
      port: 17127
    }
  };

  /**
   *
   * @param dir
   */
  constructor(dir: string) {
    this.#dir = dir;
  }

  /**
   * 使合并缓存失效
   */
  #invalidateMergedCache() {
    this.#mergedValue = null;
  }

  /**
   *
   * @returns
   */
  #update() {
    if (!this.#dir) {
      return this.#value;
    }
    // 读取配置文件
    const dir = join(process.cwd(), this.#dir);

    // 如果文件不存在
    if (!existsSync(dir)) {
      this.saveValue(this.#initValue);

      return this.#value;
    }
    try {
      const data = readFileSync(dir, 'utf-8');
      const d = YAML.parse(data);

      this.#value = d;
      this.#invalidateMergedCache();
    } catch (err) {
      logger.error({
        code: ResultCode.FailInternal,
        message: 'Config file parse error',
        data: err
      });
    }
    // 关闭旧的 watcher，防止重复监听
    if (this.#watcher) {
      this.#watcher.close();
      this.#watcher = null;
    }
    // 存在配置文件 , 开始监听文件
    this.#watcher = watch(dir, () => {
      try {
        const data = readFileSync(dir, 'utf-8');
        const d = YAML.parse(data);

        this.#value = d;
        this.#invalidateMergedCache();
      } catch (err) {
        logger.error({
          code: ResultCode.FailInternal,
          message: 'Config file parse error',
          data: err
        });
      }
    });

    return this.#value;
  }

  /**
   * 当且仅当配置文件存在时
   */
  get value(): null | {
    [key: string]: any;
  } {
    if (!this.#value) {
      this.#update();
    }

    // 使用缓存的合并结果
    if (this.#mergedValue) {
      return this.#mergedValue;
    }

    this.#mergedValue = {
      ...(this.#value || {}),
      ...(global?.__options || {})
    };

    return this.#mergedValue;
  }

  /**
   * 保存value
   */
  saveValue(value: { [key: string]: any }) {
    // 立即保存当前配置
    if (!this.#dir) {
      return;
    }
    // 读取配置文件
    const dir = join(process.cwd(), this.#dir);

    if (!existsSync(dir)) {
      mkdirSync(dirname(dir), { recursive: true });
    }
    const data = YAML.stringify(value);

    writeFileSync(dir, data, 'utf-8');
  }

  #package = null;

  /**
   * package.json
   */
  get package(): null | Package {
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
    const data = readFileSync(dir, 'utf-8');

    try {
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
    const argv: {
      [key: string]: string | null | undefined;
    } = {};

    return new Proxy(argv, {
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
  }
}

/**
 *
 * @returns
 */
export const getConfig = (): typeof ConfigCore.prototype => {
  if (global?.__config) {
    return global.__config;
  }
  const configDir = process.env.CFG_PATH || 'alemon.config.yaml';

  global.__config = new ConfigCore(configDir);

  return global.__config;
};

/**
 * @returns
 */
export const getConfigValue = () => getConfig()?.value || {};
