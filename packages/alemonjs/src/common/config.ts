import { readFileSync, existsSync, watch, writeFileSync, mkdirSync, FSWatcher } from 'fs';
import { dirname, join } from 'path';
import YAML from 'yaml';
import type { Package } from '../types/index.js';
import { logger } from './logger.js';
import { ResultCode } from './variable.js';

type ConfigValue = {
  [key: string]: any;
  autoPort?: boolean;
  apps?: string[] | { [key: string]: boolean };
  master_key?: { [key: string]: boolean } | string[];
  master_id?: { [key: string]: boolean } | string[];
  bot_key?: { [key: string]: boolean } | string[];
  bot_id?: { [key: string]: boolean } | string[];
  disabled_text_regular?: string;
  disabled_selects?: { [key: string]: boolean };
  disabled_user_id?: { [key: string]: boolean } | string[];
  disabled_user_key?: { [key: string]: boolean } | string[];
  redirect_regular?: string;
  redirect_target?: string;
  redirect_text_regular?: string;
  redirect_text_target?: string;
  mapping_text?: { regular?: string; target?: string }[];
  processor?: {
    repeated_event_time?: number;
    repeated_user_time?: number;
  };
};

type ConfigListener<T extends ConfigValue = ConfigValue> = (value: T) => void;

class ConfigCore<T extends ConfigValue = ConfigValue> {
  #value: T | null = null;
  #mergedValue: T | null = null;
  #watcher: FSWatcher | null = null;
  #listeners = new Set<ConfigListener<T>>();
  #debounceTimer: ReturnType<typeof setTimeout> | null = null;
  #debounceDelay = 100;
  #argvProxy: { [key: string]: string | null | undefined } | null = null;
  #resolvedDir: string | null = null;
  #initValue: T = {} as T;
  #package: Package | null = null;

  constructor(dir: string) {
    this.#resolvedDir = join(process.cwd(), dir);
  }

  #invalidateMergedCache() {
    this.#mergedValue = null;
  }

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

  #applyValue(newValue: T | null) {
    if (newValue === null) {
      return;
    }

    this.#value = newValue;
    this.#invalidateMergedCache();
  }

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
    this.#applyValue(value);
    this.#ensureWatcher();
  }

  onWatch(listener: ConfigListener<T>): () => void {
    this.#listeners.add(listener);

    if (!this.#value) {
      this.#init();
    } else {
      this.#ensureWatcher();
    }

    return () => {
      this.#listeners.delete(listener);
    };
  }

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

  get argv() {
    if (this.#argvProxy) {
      return this.#argvProxy;
    }

    this.#argvProxy = new Proxy({} as { [key: string]: string | null | undefined }, {
      get(_target, key) {
        if (typeof key === 'symbol') {
          return undefined;
        }

        const index0 = process.argv.indexOf(key);

        if (index0 !== -1) {
          return process.argv[index0 + 1];
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

export const getConfig = <T extends ConfigValue = ConfigValue>(): ConfigCore<T> => {
  if (global?.__config) {
    return global.__config as ConfigCore<T>;
  }

  const configDir = process.env.CFG_PATH || 'alemon.config.yaml';

  global.__config = new ConfigCore<T>(configDir);

  return global.__config as ConfigCore<T>;
};

export const getConfigValue = <T extends ConfigValue = ConfigValue>(): T => {
  return (getConfig<T>()?.value || {}) as T;
};

export const onWatchConfigValue = <T extends ConfigValue = ConfigValue>(callback: ConfigListener<T>): (() => void) => {
  return getConfig<T>().onWatch(callback);
};

export type { ConfigCore, ConfigListener, ConfigValue };
