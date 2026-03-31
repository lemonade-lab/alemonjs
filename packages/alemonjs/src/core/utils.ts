import { createHash as cryptoCreateHash } from 'node:crypto';
import { readdirSync, Dirent, existsSync } from 'fs';
import { join } from 'path';
import path from 'path';
import fs from 'fs';
import { fileSuffixResponse, ResultCode } from './variable';

import module from 'module';
import { getConfigValue } from './config';

const initRequire = () => {};

initRequire.resolve = () => '';
const require = module?.createRequire?.(import.meta.url) ?? initRequire;

/**
 * 将字符串转为定长字符串
 * @param str 输入字符串
 * @param options 可选项
 * @returns 固定长度的哈希值
 */
export const createHash = (str: string, options: { length?: number; algorithm?: string } = {}) => {
  const { length = 11, algorithm = 'sha256' } = options;
  // 使用命名导入的 cryptoCreateHash — 避免 default import 加载整个 crypto 模块
  const hash = cryptoCreateHash(algorithm).update(str).digest('hex');

  // 截取指定长度
  return hash.slice(0, length);
};

/**
 * 快速哈希（FNV-1a 32-bit）— 非加密，适用于去重 / Map key
 * 比 crypto.createHash('sha256') 快 ~30-50x
 */
export const fastHash = (str: string): string => {
  let hash = 0x811c9dc5; // FNV offset basis

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime
  }

  return (hash >>> 0).toString(36);
};

/**
 * RegExp 编译缓存 — 避免每次事件处理都重新编译正则
 */
const _regexpCache = new Map<string, RegExp>();

export const getCachedRegExp = (pattern: string | RegExp): RegExp => {
  if (pattern instanceof RegExp) {
    return pattern;
  }
  let cached = _regexpCache.get(pattern);

  if (!cached) {
    cached = new RegExp(pattern);
    _regexpCache.set(pattern, cached);
  }

  return cached;
};

/**
 * 使用用户的哈希键
 * @param e
 * @returns
 */
export const createUserHashKey = (event: { UserId: string; Platform: string }) => {
  return fastHash(`${event.Platform}:${event.UserId}`);
};

/**
 * @deprecated 已废弃，请直接使用 useUserHashKey
 */
export const useUserHashKey = createUserHashKey;

/**
 * 匹配 key 是否存在于数组或对象中
 */
export const matchIn = (source: any, key: string): boolean => {
  if (Array.isArray(source)) {
    return source.includes(key);
  }
  if (source && typeof source === 'object') {
    return Object.prototype.hasOwnProperty.call(source, key) && !!source[key];
  }

  return false;
};

/**
 * 判断用户是否为主人
 * @param UserId
 * @param platform
 * @returns
 */
export const isMaster = (UserId: string, platform: string): boolean => {
  const values = getConfigValue() || {};
  const value = values[platform] && typeof values[platform] === 'object' ? values[platform] : {};
  const UserKey = createUserHashKey({
    Platform: platform,
    UserId: UserId
  });

  return matchIn(values.master_key, UserKey) || matchIn(values.master_id, UserId) || matchIn(value.master_key, UserKey) || matchIn(value.master_id, UserId);
};

/**
 * 创建app名称
 * @param url
 * @param app 模块名
 * @param select 选择事件类型,默认 res
 * @returns
 */
export const createEventName = (url: string, appKey: string) => {
  let uri = url;

  if (process.platform === 'win32') {
    uri = uri.replace(/\\/g, '/');
  }
  // 去掉空字符串
  const names = uri.split('/').filter(item => item !== '');

  // 去掉最后一个文件名
  names.pop();
  const name = `${appKey}:${names.join(':')}`;

  return name;
};

/**
 * 将字符串转为数字
 * @deprecated 已废弃
 */
export const stringToNumber = (str: string, size = 33) => {
  let hash = 5381;
  let i = str.length;

  while (i) {
    hash = (hash * size) ^ str.charCodeAt(--i);
  }

  /* JavaScript对32位签名执行逐位操作（如上面的XOR）
   *整数。由于我们希望结果始终为正，因此转换
   *通过执行无符号位移，将带符号的int转换为无符号*/
  return hash >>> 0;
};

/**
 * 递归获取所有文件
 * @param dir
 * @param condition
 * @returns
 */
export const getRecursiveDirFiles = (
  dir: string,
  condition: (func: Dirent) => boolean = item => fileSuffixResponse.test(item.name)
): {
  path: string;
  name: string;
}[] => {
  //
  let results: {
    path: string;
    name: string;
  }[] = [];

  if (!existsSync(dir)) {
    return results;
  }
  const list = readdirSync(dir, { withFileTypes: true });

  list.forEach(item => {
    const fullPath = join(dir, item.name);

    if (item.isDirectory()) {
      results = results.concat(getRecursiveDirFiles(fullPath, condition));
    } else if (item.isFile() && condition(item)) {
      results.push({
        path: fullPath,
        name: item.name
      });
    }
  });

  return results;
};

/**
 * 解析错误并提示缺失的模块
 * @param e
 * @returns
 */
export const showErrorModule = (e: Error) => {
  if (!e) {
    return;
  }
  const moduleNotFoundRegex = /Cannot find (module|package)/;

  // 处理模块未找到的错误
  if (moduleNotFoundRegex.test(e?.message)) {
    const match = e.stack?.match(/'(.+?)'/);

    if (match) {
      const pack = match[1];

      logger.error({
        code: ResultCode.FailInternal,
        message: `缺少模块或依赖 ${pack},请安装`,
        data: null
      });

      return;
    }
  }
  // 处理其他错误
  logger.error({
    code: ResultCode.FailInternal,
    message: e?.message,
    data: e
  });
};

/**
 * 清理不可序列化的值（function, symbol, 循环引用等），确保数据可安全通过 V8 serialize / JSON / IPC 传输
 * 利用 flatted（已有依赖）做一次 stringify → parse 往返，自动剥离不可序列化的类型
 */
export const sanitizeForSerialization = (data: any): any => {
  const flatted = require('flatted');

  return flatted.parse(flatted.stringify(data));
};

const createExports = (packageJson: any) => {
  if (packageJson?.exports) {
    if (typeof packageJson.exports === 'string') {
      return packageJson.exports;
    } else if (typeof packageJson.exports === 'object') {
      return packageJson.exports['.'] || packageJson.exports['./index.js'];
    }
  }
};

export const getInputExportPath = (input?: string) => {
  const packageJsonPath = path.join(input ?? process.cwd(), 'package.json');

  if (fs.existsSync(packageJsonPath)) {
    const packageJson = require(packageJsonPath);
    const main = packageJson?.main || createExports(packageJson);

    if (main) {
      return main;
    }
  }
};

/**
 * 属于直接调用的函数
 * 参数错误直接抛出错误
 * 如果函数内部有错误，则使用 Result 进行返回
 */

/**
 * 异步方法。且需要读取返回值的进行判断的，
 * 都要以 Result 作为返回值
 */
export type Result<T = any> = {
  code: ResultCode;
  message: string | object;
  data: T;
};

/**
 * 创建结果
 * @param code
 * @param message
 * @returns
 */
export const createResult = <T>(code: ResultCode, message: string | object, data?: T): Result<T> => {
  // 如果不是 2000。则logger
  if (code !== ResultCode.Ok) {
    logger.error({
      code,
      message,
      data: data
    });
  }

  return {
    code,
    message,
    data: data
  };
};
