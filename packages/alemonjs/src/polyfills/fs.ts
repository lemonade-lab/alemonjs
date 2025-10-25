// src/polyfills/fs.ts

// 完整的无错误 fs polyfill
export const existsSync = (path: string): boolean => {
  console.warn(`[AlemonJS Browser] fs.existsSync('${path}') is not available in browser, returning false`);

  return false;
};

export const readFileSync = (path: string, encoding?: string): string => {
  console.warn(`[AlemonJS Browser] fs.readFileSync('${path}') is not available in browser, returning empty string`);

  return '';
};

export const writeFileSync = (path: string, data: string): void => {
  console.warn(`[AlemonJS Browser] fs.writeFileSync('${path}') is not available in browser, operation skipped`);
  // 静默失败，不抛出错误
};

export const mkdirSync = (path: string, options?: any): void => {
  console.warn(`[AlemonJS Browser] fs.mkdirSync('${path}') is not available in browser, operation skipped`);
  // 静默失败，不抛出错误
};

export const watch = (path: string, options?: any): any => {
  console.warn(`[AlemonJS Browser] fs.watch('${path}') is not available in browser, returning mock watcher`);

  // 返回一个模拟的 watcher 对象
  return {
    close: () => {
      console.warn('[AlemonJS Browser] Mock fs.watch close() called');
    },
    on: (event: string, callback: Function) => {
      console.warn(`[AlemonJS Browser] Mock fs.watch on('${event}') called`);
    },
    ref: () => {
      console.warn('[AlemonJS Browser] Mock fs.watch ref() called');

      return this;
    },
    unref: () => {
      console.warn('[AlemonJS Browser] Mock fs.watch unref() called');

      return this;
    }
  };
};

export const readdirSync = (path: string): string[] => {
  console.warn(`[AlemonJS Browser] fs.readdirSync('${path}') is not available in browser, returning empty array`);

  return [];
};

export const statSync = (path: string): any => {
  console.warn(`[AlemonJS Browser] fs.statSync('${path}') is not available in browser, returning mock stats`);

  // 返回模拟的 stats 对象
  return {
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
  };
};

export const unlinkSync = (path: string): void => {
  console.warn(`[AlemonJS Browser] fs.unlinkSync('${path}') is not available in browser, operation skipped`);
};

export const rmdirSync = (path: string, options?: any): void => {
  console.warn(`[AlemonJS Browser] fs.rmdirSync('${path}') is not available in browser, operation skipped`);
};

export const renameSync = (oldPath: string, newPath: string): void => {
  console.warn(`[AlemonJS Browser] fs.renameSync('${oldPath}', '${newPath}') is not available in browser, operation skipped`);
};

export const copyFileSync = (src: string, dest: string, flags?: number): void => {
  console.warn(`[AlemonJS Browser] fs.copyFileSync('${src}', '${dest}') is not available in browser, operation skipped`);
};

export const appendFileSync = (path: string, data: string, options?: any): void => {
  console.warn(`[AlemonJS Browser] fs.appendFileSync('${path}') is not available in browser, operation skipped`);
};

// 异步函数 - 全部使用回调方式，不抛出错误
export const writeFile = (path: string, data: string, callback?: (err: any) => void): void => {
  console.warn(`[AlemonJS Browser] fs.writeFile('${path}') is not available in browser, operation skipped`);

  if (callback) {
    // 异步调用回调，模拟成功（不传递错误）
    setTimeout(() => callback(null), 0);
  }
};

export const readFile = (path: string, encoding: string, callback?: (err: any, data: string) => void): void => {
  console.warn(`[AlemonJS Browser] fs.readFile('${path}') is not available in browser, returning empty data`);

  if (callback) {
    // 异步调用回调，返回空数据
    setTimeout(() => callback(null, ''), 0);
  }
};

export const mkdir = (path: string, options: any, callback?: (err: any) => void): void => {
  console.warn(`[AlemonJS Browser] fs.mkdir('${path}') is not available in browser, operation skipped`);

  if (callback) {
    // 异步调用回调，模拟成功
    setTimeout(() => callback(null), 0);
  }
};

export const unlink = (path: string, callback?: (err: any) => void): void => {
  console.warn(`[AlemonJS Browser] fs.unlink('${path}') is not available in browser, operation skipped`);

  if (callback) {
    setTimeout(() => callback(null), 0);
  }
};

export const rmdir = (path: string, callback?: (err: any) => void): void => {
  console.warn(`[AlemonJS Browser] fs.rmdir('${path}') is not available in browser, operation skipped`);

  if (callback) {
    setTimeout(() => callback(null), 0);
  }
};

export const rename = (oldPath: string, newPath: string, callback?: (err: any) => void): void => {
  console.warn(`[AlemonJS Browser] fs.rename('${oldPath}', '${newPath}') is not available in browser, operation skipped`);

  if (callback) {
    setTimeout(() => callback(null), 0);
  }
};

// Promise-based 方法
export const promises = {
  writeFile: async (path: string, data: string): Promise<void> => {
    console.warn(`[AlemonJS Browser] fs.promises.writeFile('${path}') is not available in browser, operation skipped`);

    return Promise.resolve();
  },

  readFile: async (path: string, encoding?: string): Promise<string> => {
    console.warn(`[AlemonJS Browser] fs.promises.readFile('${path}') is not available in browser, returning empty string`);

    return Promise.resolve('');
  },

  mkdir: async (path: string, options?: any): Promise<void> => {
    console.warn(`[AlemonJS Browser] fs.promises.mkdir('${path}') is not available in browser, operation skipped`);

    return Promise.resolve();
  },

  readdir: async (path: string): Promise<string[]> => {
    console.warn(`[AlemonJS Browser] fs.promises.readdir('${path}') is not available in browser, returning empty array`);

    return Promise.resolve([]);
  },

  stat: async (path: string): Promise<any> => {
    console.warn(`[AlemonJS Browser] fs.promises.stat('${path}') is not available in browser, returning mock stats`);

    return Promise.resolve(statSync(path));
  },

  unlink: async (path: string): Promise<void> => {
    console.warn(`[AlemonJS Browser] fs.promises.unlink('${path}') is not available in browser, operation skipped`);

    return Promise.resolve();
  },

  rmdir: async (path: string): Promise<void> => {
    console.warn(`[AlemonJS Browser] fs.promises.rmdir('${path}') is not available in browser, operation skipped`);

    return Promise.resolve();
  }
};

// 流相关方法
export const createReadStream = (path: string, options?: any): any => {
  console.warn(`[AlemonJS Browser] fs.createReadStream('${path}') is not available in browser, returning mock stream`);

  // 返回一个模拟的 stream 对象
  const mockStream = {
    on: (event: string, listener: Function) => {
      if (event === 'error') {
        // 立即触发错误
        setTimeout(() => listener(new Error(`Cannot create read stream for ${path} in browser`)), 0);
      }

      return mockStream;
    },
    pipe: () => mockStream,
    destroy: () => {},
    pause: () => mockStream,
    resume: () => mockStream
  };

  return mockStream;
};

export const createWriteStream = (path: string, options?: any): any => {
  console.warn(`[AlemonJS Browser] fs.createWriteStream('${path}') is not available in browser, returning mock stream`);

  // 返回一个模拟的 stream 对象
  const mockStream = {
    write: (data: any) => {
      console.warn(`[AlemonJS Browser] Mock write stream write() called for ${path}`);

      return true;
    },
    end: () => {
      console.warn(`[AlemonJS Browser] Mock write stream end() called for ${path}`);
    },
    on: (event: string, listener: Function) => {
      return mockStream;
    },
    destroy: () => {},
    pipe: () => mockStream
  };

  return mockStream;
};

// 常量
export const constants = {
  F_OK: 0,
  R_OK: 4,
  W_OK: 2,
  X_OK: 1,
  O_RDONLY: 0,
  O_WRONLY: 1,
  O_RDWR: 2,
  O_CREAT: 64,
  O_EXCL: 128,
  O_NOCTTY: 256,
  O_TRUNC: 512,
  O_APPEND: 1024,
  O_DIRECTORY: 65536,
  O_NOATIME: 262144,
  O_NOFOLLOW: 131072,
  O_SYNC: 1052672,
  O_DSYNC: 4096,
  O_DIRECT: 16384,
  O_NONBLOCK: 2048
};

// 默认导出
export default {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  watch,
  readdirSync,
  statSync,
  unlinkSync,
  rmdirSync,
  renameSync,
  copyFileSync,
  appendFileSync,
  writeFile,
  readFile,
  mkdir,
  unlink,
  rmdir,
  rename,
  promises,
  createReadStream,
  createWriteStream,
  constants
};
