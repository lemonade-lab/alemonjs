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

  if (global.publicip && !force) {
    return global.publicip;
  }

  return await publicIp({
    onlyHttps: true,
    ...config
  }).then(ip => {
    global.publicip = ip;

    return global.publicip;
  });
};

/**
 * 正则表达式工具类
 */
export class Regular extends RegExp {
  public static or(...regs: RegExp[]): Regular {
    return new Regular(`(${regs.map(reg => reg.source).join('|')})`, regs.map(reg => reg.flags).join(''));
  }

  public static and(...regs: RegExp[]): Regular {
    return new Regular(regs.map(reg => `(?=${reg.source})`).join('') + '.*', regs.map(reg => reg.flags).join(''));
  }

  or(...regs: RegExp[]): Regular {
    return Regular.or(this, ...regs);
  }

  and(...regs: RegExp[]): Regular {
    return Regular.and(this, ...regs);
  }
}
