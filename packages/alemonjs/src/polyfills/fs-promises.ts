// 浏览器环境的 fs/promises polyfill - 无错误版本
export const readFile = async (path: string, encoding?: string): Promise<Buffer> => {
  console.warn(`[AlemonJS Browser] fs/promises.readFile('${path}') is not available in browser, returning empty buffer`);

  return Buffer.from('');
};

export const writeFile = async (path: string, data: any): Promise<void> => {
  console.warn(`[AlemonJS Browser] fs/promises.writeFile('${path}') is not available in browser, operation skipped`);

  return Promise.resolve();
};

export const readdir = async (path: string): Promise<string[]> => {
  console.warn(`[AlemonJS Browser] fs/promises.readdir('${path}') is not available in browser, returning empty array`);

  return Promise.resolve([]);
};

export const mkdir = async (path: string, options?: any): Promise<void> => {
  console.warn(`[AlemonJS Browser] fs/promises.mkdir('${path}') is not available in browser, operation skipped`);

  return Promise.resolve();
};

export const stat = async (path: string): Promise<any> => {
  console.warn(`[AlemonJS Browser] fs/promises.stat('${path}') is not available in browser, returning mock stats`);

  // 返回模拟的 stats 对象
  return Promise.resolve({
    isDirectory: () => false,
    isFile: () => false,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isSymbolicLink: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    dev: 0,
    ino: 0,
    mode: 0,
    nlink: 0,
    uid: 0,
    gid: 0,
    rdev: 0,
    size: 0,
    blksize: 0,
    blocks: 0,
    atimeMs: 0,
    mtimeMs: 0,
    ctimeMs: 0,
    birthtimeMs: 0,
    atime: new Date(),
    mtime: new Date(),
    ctime: new Date(),
    birthtime: new Date()
  });
};

export const unlink = async (path: string): Promise<void> => {
  console.warn(`[AlemonJS Browser] fs/promises.unlink('${path}') is not available in browser, operation skipped`);

  return Promise.resolve();
};

export const rmdir = async (path: string, options?: any): Promise<void> => {
  console.warn(`[AlemonJS Browser] fs/promises.rmdir('${path}') is not available in browser, operation skipped`);

  return Promise.resolve();
};

export const rename = async (oldPath: string, newPath: string): Promise<void> => {
  console.warn(`[AlemonJS Browser] fs/promises.rename('${oldPath}', '${newPath}') is not available in browser, operation skipped`);

  return Promise.resolve();
};

export const copyFile = async (src: string, dest: string, flags?: number): Promise<void> => {
  console.warn(`[AlemonJS Browser] fs/promises.copyFile('${src}', '${dest}') is not available in browser, operation skipped`);

  return Promise.resolve();
};

export const appendFile = async (path: string, data: string, options?: any): Promise<void> => {
  console.warn(`[AlemonJS Browser] fs/promises.appendFile('${path}') is not available in browser, operation skipped`);

  return Promise.resolve();
};

export const access = async (path: string, mode?: number): Promise<void> => {
  console.warn(`[AlemonJS Browser] fs/promises.access('${path}') is not available in browser, operation skipped`);

  return Promise.resolve();
};

export const readlink = async (path: string): Promise<string> => {
  console.warn(`[AlemonJS Browser] fs/promises.readlink('${path}') is not available in browser, returning empty string`);

  return Promise.resolve('');
};

export const symlink = async (target: string, path: string, type?: string): Promise<void> => {
  console.warn(`[AlemonJS Browser] fs/promises.symlink('${target}', '${path}') is not available in browser, operation skipped`);

  return Promise.resolve();
};

export const lstat = async (path: string): Promise<any> => {
  console.warn(`[AlemonJS Browser] fs/promises.lstat('${path}') is not available in browser, returning mock stats`);

  return stat(path);
};

export const chmod = async (path: string, mode: number): Promise<void> => {
  console.warn(`[AlemonJS Browser] fs/promises.chmod('${path}') is not available in browser, operation skipped`);

  return Promise.resolve();
};

export const chown = async (path: string, uid: number, gid: number): Promise<void> => {
  console.warn(`[AlemonJS Browser] fs/promises.chown('${path}') is not available in browser, operation skipped`);

  return Promise.resolve();
};

export const realpath = async (path: string): Promise<string> => {
  console.warn(`[AlemonJS Browser] fs/promises.realpath('${path}') is not available in browser, returning empty string`);

  return Promise.resolve('');
};

export const mkdtemp = async (prefix: string): Promise<string> => {
  console.warn(`[AlemonJS Browser] fs/promises.mkdtemp('${prefix}') is not available in browser, returning mock path`);

  return Promise.resolve(`/tmp/${prefix}${Math.random().toString(36).substr(2, 9)}`);
};

export const opendir = async (path: string): Promise<any> => {
  console.warn(`[AlemonJS Browser] fs/promises.opendir('${path}') is not available in browser, returning mock dir`);

  const mockDir = {
    [Symbol.asyncIterator]: () => {
      return {
        next: () => Promise.resolve({ done: true, value: null })
      };
    },
    close: async () => {
      console.warn('[AlemonJS Browser] Mock dir close() called');
    },
    path: path,
    read: async () => null,
    readSync: () => null
  };

  return Promise.resolve(mockDir);
};

// 默认导出
export default {
  readFile,
  writeFile,
  readdir,
  mkdir,
  stat,
  unlink,
  rmdir,
  rename,
  copyFile,
  appendFile,
  access,
  readlink,
  symlink,
  lstat,
  chmod,
  chown,
  realpath,
  mkdtemp,
  opendir
};
