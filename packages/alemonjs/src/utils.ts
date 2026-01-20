import { existsSync, PathLike } from 'fs';
import axios from 'axios';
import { toDataURL } from 'qrcode';
import { writeFile } from 'fs';
import { createReadStream } from 'fs';
import { Readable, isReadable } from 'node:stream';
import { basename } from 'path';
import { fileTypeFromBuffer, fileTypeFromStream } from 'file-type';
import { publicIp, Options } from 'public-ip';
/**
 * 通过URL获取Buffer
 * @param url
 * @returns
 */
export const getBufferByURL = async (url: string): Promise<Buffer> => {
  return await axios
    .get(url, {
      responseType: 'arraybuffer'
    })
    .then(res => Buffer.from(res.data, 'binary'));
};

/**
 * 生成二维码
 * @param text
 * @param targetPath
 * @returns
 */
export const createQRCode = async (text: string, targetPath?: string): Promise<Buffer | false> => {
  try {
    const qrDataURL = await new Promise<string>((resolve, reject) => {
      toDataURL(
        text,
        {
          margin: 2,
          width: 500
        },
        (err: any, qrDataURL: any) => {
          if (err) {
            console.error(err);
            reject(err);
          } else {
            resolve(qrDataURL);
          }
        }
      );
    });
    const bufferData = Buffer.from(qrDataURL.split(',')[1], 'base64');

    if (targetPath) {
      writeFile(targetPath, bufferData, (err: NodeJS.ErrnoException | null) => {
        if (err) {
          throw err;
        }
        console.info(targetPath);
      });
    }

    return bufferData;
  } catch (err) {
    console.error(err);

    return false;
  }
};

export class Counter {
  #counter = 1;
  #val = 0;

  /**
   * 计数器
   * @param initialValue
   */
  constructor(initialValue: number) {
    this.#counter = initialValue;
    this.#val = initialValue;
  }

  /**
   * 获取当前计数值
   */
  get value(): number {
    return this.#counter;
  }

  /**
   * 获取下一个计数值
   * @returns
   */
  public next(): number {
    return ++this.#counter;
  }

  /**
   * 重置计数器
   * @param initialValue
   */
  public reStart(initialValue?: number) {
    if (initialValue !== undefined) {
      this.#val = initialValue;
      this.#counter = initialValue;
    } else {
      this.#counter = this.#val;
    }
  }
}

/**
 * 创建form
 * @param options.url
 * @param options.image
 * @param options.name
 * @description 支持以下几种方式创建图片数据：
 * 1. 通过url获取图片数据
 * 2. 通过图片路径获取图片数据
 * 3. 通过base64字符串获取图片数据
 * 4. 通过Buffer获取图片数据
 * 5. 通过Readable流获取图片数据
 * @returns
 */
export async function createPicFrom(options: { url?: PathLike; image?: string | Buffer | Readable; name?: string }) {
  let { url, image, name } = options;
  let picData: Readable;

  const pushBuffer = (buffer: Buffer) => {
    picData = new Readable();
    picData.push(buffer);
    // end
    picData.push(null);
  };

  if (url) {
    if (!existsSync(url)) {
      return;
    }
    if (!name) {
      name = basename(url.toString());
    }
    picData = createReadStream(url);
  } else if (typeof image === 'string') {
    // base64
    if (image.startsWith('data:')) {
      const base64Data = image.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      const type = await fileTypeFromBuffer(buffer);

      name = 'file.' + (type?.ext ?? 'jpg');
      pushBuffer(buffer);
    } else if (existsSync(image)) {
      if (!name) {
        name = basename(image);
      }
      picData = createReadStream(image);
    } else {
      return;
    }
  } else if (Buffer.isBuffer(image)) {
    if (!name) {
      const type = await fileTypeFromBuffer(image);

      name = 'file.' + (type?.ext ?? 'jpg');
    }
    pushBuffer(image);
  } else if (isReadable(image)) {
    if (!name) {
      const img = Readable.toWeb(image);
      const type = await fileTypeFromStream(img);

      name = 'file.' + (type?.ext ?? 'jpg');
    }
    picData = image;
  } else {
    return;
  }

  return { picData, name };
}

/**
 *
 * @param options
 * @returns
 */
export const getPublicIP = async (
  options: Options & {
    // 重新获取
    force?: boolean;
  } = {}
): Promise<string> => {
  const { force, ...config } = options;

  if (global.__publicIp && !force) {
    return global.__publicIp;
  }

  return await publicIp({
    onlyHttps: true,
    ...config
  }).then(ip => {
    global.__publicIp = ip;

    return global.__publicIp;
  });
};

/**
 * 正则表达式工具类
 */
export class Regular extends RegExp {
  /**
   * 创建 Regular 实例
   * @param pattern
   * @param flags
   * @returns
   */
  public static create(pattern: RegExp | string, flags?: string): Regular {
    return new Regular(pattern, flags);
  }

  /**
   * 合并多个正则表达式的 flags，去重并排序
   * @param flags
   * @returns
   */
  private static mergeFlags(...flags: string[]): string {
    const flagSet = new Set<string>();

    for (const flagStr of flags) {
      for (const char of flagStr) {
        flagSet.add(char);
      }
    }

    // 按照字母顺序排序，确保一致性
    return Array.from(flagSet).sort().join('');
  }

  /**
   * @param regulars
   * @returns
   */
  public static or(...regulars: RegExp[]): Regular {
    // 对于 OR 操作，使用非捕获组 (?:...)

    // 取出每个正则的 source 并用 | 连接
    const source = regulars.map(reg => `(?:${reg.source})`).join('|');
    // 合并 flags
    const flags = Regular.mergeFlags(...regulars.map(reg => reg.flags));

    // 重新创建 Regular 实例
    return new Regular(`(?:${source})`, flags);
  }

  /**
   * @param regulars
   * @returns
   */
  public static and(...regulars: RegExp[]): Regular {
    // 对于 AND 操作，使用正向先行断言
    const lookAHeads = regulars.map(reg => `(?=.*${reg.source})`).join('');
    // 合并 flags
    const flags = Regular.mergeFlags(...regulars.map(reg => reg.flags));

    // 重新创建 Regular 实例
    return new Regular(`${lookAHeads}.*`, flags);
  }

  or(...regulars: RegExp[]): Regular {
    return Regular.or(this, ...regulars);
  }

  and(...regulars: RegExp[]): Regular {
    return Regular.and(this, ...regulars);
  }

  /**
   * 追加新的 flags
   */
  withFlags(flags: 'i' | 'g' | 'm' | 's' | 'u' | 'y'): Regular {
    const mergedFlags = Regular.mergeFlags(this.flags, flags);

    return new Regular(this.source, mergedFlags);
  }

  /**
   * 去除指定的 flags
   */
  withoutFlags(flagsToRemove: 'i' | 'g' | 'm' | 's' | 'u' | 'y'): Regular {
    const currentFlagsSet = new Set(this.flags);

    for (const char of flagsToRemove) {
      currentFlagsSet.delete(char);
    }
    const newFlags = Array.from(currentFlagsSet).sort().join('');

    return new Regular(this.source, newFlags);
  }
}
