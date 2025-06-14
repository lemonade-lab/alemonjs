import { existsSync, readFileSync } from 'fs'
import axios from 'axios'
import { join } from 'path'
import { toDataURL } from 'qrcode'
import { writeFile } from 'fs'

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
    .then(res => Buffer.from(res.data, 'binary'))
}

/**
 * 通过路径获取Buffer
 * @param val
 * @returns
 */
export const getBufferByPath = (val: string): Buffer | undefined => {
  const add = join(process.cwd(), val)
  // 绝对路径
  if (existsSync(add)) return Buffer.from(readFileSync(add))
  // 相对路径
  if (existsSync(val)) return Buffer.from(readFileSync(val))
}

/**
 * 生成二维码
 * @param text
 * @param localpath
 * @returns
 */
export const createQRCode = async (text: string, localpath?: string): Promise<Buffer | false> => {
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
            console.error(err)
            reject(err)
          } else {
            resolve(qrDataURL)
          }
        }
      )
    })
    const bufferData = Buffer.from(qrDataURL.split(',')[1], 'base64')
    if (localpath != undefined) {
      writeFile(localpath, bufferData, (err: NodeJS.ErrnoException | null) => {
        if (err) throw err
        console.info('buffer set', localpath)
      })
    }
    return bufferData
  } catch (err) {
    console.error(err)
    return false
  }
}

export class Counter {
  #counter = 1
  #val = 0

  /**
   * 计数器
   * @param initialValue
   */
  constructor(initialValue: number) {
    this.#counter = initialValue
    this.#val = initialValue
  }

  /**
   * 获取当前计数值
   */
  get value(): number {
    return this.#counter
  }

  /**
   * 获取下一个计数值
   * @returns
   */
  public next(): number {
    return ++this.#counter
  }

  /**
   * 重置计数器
   * @param initialValue
   */
  public reStart(initialValue?: number) {
    if (initialValue !== undefined) {
      this.#val = initialValue
      this.#counter = initialValue
    } else {
      this.#counter = this.#val
    }
  }
}
