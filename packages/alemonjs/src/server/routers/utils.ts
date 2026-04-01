import fs, { existsSync } from 'fs';
import path from 'path';

/**
 * 确保解析后的路径在 root 目录内，防止路径遍历攻击（../）
 * @returns 安全的绝对路径，如果越界则返回 null
 */
export const safePath = (root: string, untrusted: string): string | null => {
  const resolved = path.resolve(root, untrusted);

  // 确保 resolved 以 root + sep 开头（或恰好等于 root）
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    return null;
  }

  return resolved;
};

/**
 * 校验 npm 包名是否合法（包含 scoped 包）
 * 不允许路径分隔符、.. 等注入
 */
export const isValidPackageName = (name: string): boolean => {
  // 符合 npm 包名规范: @scope/name 或 name
  return /^(?:@[a-z0-9\-~][a-z0-9\-._~]*\/)?[a-z0-9\-~][a-z0-9\-._~]*$/.test(name);
};
export const getModuelFile = (dir: string) => {
  const dirMap: Record<string, string> = {
    '.js': `${dir}.js`,
    '.jsx': `${dir}.jsx`,
    '.mjs': `${dir}.mjs`,
    '.cjs': `${dir}.cjs`,
    '/index.js': `${dir}/index.js`,
    '/index.jsx': `${dir}/index.jsx`,
    '/index.mjs': `${dir}/index.mjs`,
    '/index.cjs': `${dir}/index.cjs`,
    '.ts': `${dir}.ts`,
    '.tsx': `${dir}.tsx`,
    '/index.ts': `${dir}/index.ts`,
    '/index.tsx': `${dir}/index.tsx`
  };

  for (const key in dirMap) {
    const filePath = dirMap[key];

    if (existsSync(filePath) && fs.statSync(filePath)) {
      return filePath;
    }
  }

  return '';
};

export const formatPath = (path: string) => {
  if (!path || path === '/') {
    return '/index.html';
  }
  const pates = path.split('/');
  const lastPath = pates[pates.length - 1];

  if (lastPath.includes('.')) {
    return path;
  }
  path += '.html';

  return path;
};
