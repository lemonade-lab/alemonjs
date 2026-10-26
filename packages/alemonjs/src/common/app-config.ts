import callerPath from 'caller-path';
import { readFileSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getConfig, type ConfigCore, type ConfigValue } from './config.js';
import { logger } from './logger.js';
import { isDeepStrictEqual } from 'node:util';
import { cloneDeep } from 'lodash-es';

// caller-path 按 receiver 查找调用方，ESM 普通函数链可能被跳过。
// 以公共入口截断栈，校验直接调用文件，避免读到外层应用的配置。
function directCallerPath(entry: (...args: never[]) => unknown): string | undefined {
  const prepareStackTrace = Error.prepareStackTrace;

  try {
    let filename: string | undefined;

    Error.prepareStackTrace = (_error, stack) => {
      filename = stack[0]?.getFileName() ?? undefined;

      return '';
    };
    const error = new Error();

    Error.captureStackTrace(error, entry);
    void error.stack;

    return filename;
  } finally {
    Error.prepareStackTrace = prepareStackTrace;
  }
}

function isWithin(root: string, target: string): boolean {
  const path = relative(root, target);

  return path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path);
}

function resolveAppName(entry: (...args: never[]) => unknown): string | undefined {
  const empty = (reason: string): undefined => {
    logger.warn(`[getAppConfig] ${reason}`);

    return undefined;
  };
  let caller: string | undefined;

  try {
    const detectedCaller = callerPath();
    const directCaller = directCallerPath(entry);

    caller = directCaller ?? detectedCaller;
  } catch {
    return empty('无法识别调用文件，返回空配置。');
  }

  if (!caller) {
    return empty('无法识别调用文件，返回空配置。');
  }

  let root: string;
  let directory: string;

  try {
    const filename = caller.startsWith('file:') ? fileURLToPath(caller) : caller;

    if (!isAbsolute(filename)) {
      return empty('调用文件不是绝对路径，返回空配置。');
    }
    // 统一真实路径，避免符号链接或 --preserve-symlinks 绕过 cwd 边界。
    root = realpathSync(process.cwd());
    directory = dirname(realpathSync(filename));
  } catch {
    return empty('无法解析调用文件或 cwd 路径，返回空配置。');
  }

  if (!isWithin(root, directory)) {
    return empty(`调用文件位于 cwd 外，不读取其包配置：${caller}`);
  }

  while (true) {
    const manifest = join(directory, 'package.json');
    let pkg: unknown;

    try {
      const manifestPath = realpathSync(manifest);

      if (!isWithin(root, manifestPath)) {
        return empty(`package.json 指向 cwd 外，返回空配置：${manifest}`);
      }
      pkg = JSON.parse(readFileSync(manifestPath, 'utf8'));
      if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg)) {
        return empty(`package.json 必须是对象，返回空配置：${manifest}`);
      }
      if ('name' in pkg) {
        if (typeof pkg.name !== 'string' || !pkg.name.trim()) {
          return empty(`package.json 的 name 无效，返回空配置：${manifest}`);
        }

        return pkg.name;
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        return empty(`无法读取或解析 package.json，返回空配置：${manifest}`);
      }
    }

    // 先检查 cwd/package.json，再停止；绝不读取 cwd 的父目录。
    if (directory === root) {
      return empty(`在 cwd 范围内未找到带有 name 的 package.json：${root}`);
    }
    directory = dirname(directory);
  }
}

/** 当前应用在框架配置中的视图。dispose 仅取消本视图注册的监听。 */
export class AppConfig<T extends ConfigValue = ConfigValue> {
  readonly name: string | undefined;
  #config: ConfigCore | undefined;
  #listeners = new Set<() => void>();

  constructor(name: string | undefined, config?: ConfigCore) {
    this.name = name;
    this.#config = config;
  }

  #read(values: ConfigValue): Partial<T> {
    if (!this.name || !Object.prototype.hasOwnProperty.call(values, this.name)) {
      return {};
    }
    const value = values[this.name];

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      logger.warn(`[getAppConfig] 应用 ${this.name} 的配置不是对象，返回空配置。`);

      return {};
    }

    return value as Partial<T>;
  }

  get value(): Partial<T> {
    return this.#read(this.#config?.value ?? {});
  }

  get path(): string | null {
    return this.#config?.path ?? null;
  }

  /** 替换当前应用的配置，保留框架其他配置。识别失败时只警告，不写入。 */
  saveValue(value: Partial<T>): void {
    if (!this.name || !this.#config) {
      logger.warn('[getAppConfig] 未识别应用，跳过保存配置。');

      return;
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      logger.warn(`[getAppConfig] 应用 ${this.name} 的配置必须是对象，跳过保存。`);

      return;
    }
    this.#config.saveValue({ ...this.#config.value, [this.name]: value });
  }

  reload(): void {
    this.#config?.reload();
  }

  /** 复用框架的配置文件监听，仅在当前应用配置变化时通知。 */
  onWatch(listener: (value: Partial<T>) => void): () => void {
    if (!this.#config) {
      return () => {};
    }
    let previous = cloneDeep(this.value);
    const stop = this.#config.onWatch(values => {
      const value = this.#read(values);

      if (isDeepStrictEqual(previous, value)) {
        return;
      }
      previous = cloneDeep(value);
      listener(value);
    });
    const unsubscribe = () => {
      stop();
      this.#listeners.delete(unsubscribe);
    };

    this.#listeners.add(unsubscribe);

    return unsubscribe;
  }

  dispose(): void {
    for (const unsubscribe of this.#listeners) {
      unsubscribe();
    }
  }
}

function appConfigFor<T extends ConfigValue>(entry: (...args: never[]) => unknown): AppConfig<T> {
  const name = resolveAppName(entry);

  return new AppConfig<T>(name, name ? getConfig() : undefined);
}

/** 自动识别调用应用，返回配置管理对象。查找包含 cwd，绝不越过 cwd。 */
export function getAppConfig<T extends ConfigValue = ConfigValue>(): AppConfig<T> {
  return appConfigFor<T>(getAppConfig);
}

/** 自动识别调用应用，直接读取配置值；识别失败只警告并返回空对象。 */
export function getAppConfigValue<T extends ConfigValue = ConfigValue>(): Partial<T> {
  return appConfigFor<T>(getAppConfigValue).value;
}
