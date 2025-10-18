import fs, { existsSync } from 'fs';

// 输入一个文件路径。
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
