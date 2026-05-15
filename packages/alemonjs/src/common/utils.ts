import { createHash as cryptoCreateHash } from 'node:crypto';
import { readdirSync, Dirent, existsSync } from 'fs';
import { join } from 'path';
import path from 'path';
import fs from 'fs';
import module from 'module';
import { fileSuffixResponse, ResultCode } from './variable.js';
import { logger } from './logger.js';

export { createUserHashKey, fastHash, isMaster, matchIn, useUserHashKey } from './identity.js';
export type { Result } from './result.js';
export { createResult } from './result.js';

const initRequire = () => {};

initRequire.resolve = () => '';
const require = module?.createRequire?.(import.meta.url) ?? initRequire;

export const createHash = (str: string, options: { length?: number; algorithm?: string } = {}) => {
  const { length = 11, algorithm = 'sha256' } = options;
  const hash = cryptoCreateHash(algorithm).update(str).digest('hex');

  return hash.slice(0, length);
};

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

export const createEventName = (url: string, appKey: string) => {
  let uri = url;

  if (process.platform === 'win32') {
    uri = uri.replace(/\\/g, '/');
  }
  const names = uri.split('/').filter(item => item !== '');

  names.pop();

  return `${appKey}:${names.join(':')}`;
};

export const stringToNumber = (str: string, size = 33) => {
  let hash = 5381;
  let i = str.length;

  while (i) {
    hash = (hash * size) ^ str.charCodeAt(--i);
  }

  return hash >>> 0;
};

export const getRecursiveDirFiles = (
  dir: string,
  condition: (func: Dirent) => boolean = item => fileSuffixResponse.test(item.name)
): {
  path: string;
  name: string;
}[] => {
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

export const showErrorModule = (e: Error) => {
  if (!e) {
    return;
  }
  const moduleNotFoundRegex = /Cannot find (module|package)/;

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

  logger.error({
    code: ResultCode.FailInternal,
    message: e?.message,
    data: e
  });
};

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
