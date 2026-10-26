import callerPath from 'caller-path';
import { readFileSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getConfigValue, type ConfigValue } from './config.js';
import { logger } from './logger.js';

// caller-path 按 receiver 查找调用方，ESM 普通函数链可能被跳过。
// 以公共入口截断栈，校验直接调用文件，避免读到外层应用的配置。
function directCallerPath(): string | undefined {
  const prepareStackTrace = Error.prepareStackTrace;

  try {
    let filename: string | undefined;

    Error.prepareStackTrace = (_error, stack) => {
      filename = stack[0]?.getFileName() ?? undefined;

      return '';
    };
    const error = new Error();

    Error.captureStackTrace(error, getAppConfig);
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

/**
 * 按调用文件所属 package.json 的 name 读取应用配置，查找不越过 cwd。
 * 包含 cwd 自身；无 name 的清单继续向上查找。识别失败只警告并返回空对象。
 * 每次读取当前配置；返回对象与框架配置共享引用，不应直接修改。
 */
export function getAppConfig<T extends ConfigValue = ConfigValue>(): Partial<T> {
  const empty = (reason: string): Partial<T> => {
    logger.warn(`[getAppConfig] ${reason}`);

    return {};
  };
  let caller: string | undefined;

  try {
    const detectedCaller = callerPath();
    const directCaller = directCallerPath();

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
        const values = getConfigValue();
        const value = Object.prototype.hasOwnProperty.call(values, pkg.name) ? values[pkg.name] : undefined;

        // 应用配置是可选的，不存在时正常返回空对象。
        if (value === undefined) {
          return {};
        }
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
          return empty(`应用 ${pkg.name} 的配置不是对象，返回空配置。`);
        }

        return value as Partial<T>;
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
