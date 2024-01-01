import { existsSync, readFileSync, createReadStream } from 'fs'
import axios from 'axios'
import { join } from 'path'
import { Readable, isReadable } from 'stream'
import { basename } from 'path'
import { fileTypeFromBuffer, fileTypeFromStream } from 'file-type'
import { toDataURL } from 'qrcode'
import { writeFile, readFile } from 'fs'
class BufferData {
  /**
   * 异步请求图片
   * @param url 网络地址
   * @returns buffer
   */
  async getUrl(url: string) {
    return await axios
      .get(url, {
        responseType: 'arraybuffer'
      })
      .then(res => {
        if (res.data) return Buffer.from(res.data, 'binary')
        return false
      })
  }

  /**
   * 读取本地图片
   * @param val
   * @returns
   */
  getPath(val: string) {
    const add = join(process.cwd(), val)
    try {
      // 绝对路径
      if (existsSync(add)) return Buffer.from(readFileSync(add))
      // 相对路径
      if (existsSync(val)) return Buffer.from(readFileSync(val))
    } catch (err) {
      console.info(err)
    }
    return false
  }

  /**
   * 链接转化为二维码
   * @param text 链接
   * @param localpath 可选,要保存的路径
   * @returns buffer
   */
  async qrcode(text: string, localpath?: string): Promise<false | Buffer> {
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
        setBuffer(localpath, bufferData)
      }
      return bufferData
    } catch (err) {
      console.error(err)
      return false
    }
  }
  /**
   * 读取buffer文件
   * @param localpath 读取地址
   * @returns buffer
   */
  get(localpath: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      readFile(
        localpath,
        (err: NodeJS.ErrnoException | null, bufferData: Buffer) => {
          if (err) {
            reject(err)
          } else {
            console.info('buffer read', localpath)
            resolve(bufferData)
          }
        }
      )
    })
  }
  /**
   * 写入buffer
   * @param localpath 写入地址
   * @param bufferData 数据
   */
  set(localpath: string, bufferData: Buffer) {
    writeFile(localpath, bufferData, (err: NodeJS.ErrnoException | null) => {
      if (err) throw err
      console.info('buffer set', localpath)
    })
    return
  }
}
export const BUFFER = new BufferData()
/**
 * 读取buffer文件
 * @param localpath 读取地址
 * @returns buffer
 */
export const getBuffer = BUFFER.get
/**
 * 写入buffer
 * @param localpath 写入地址
 * @param bufferData 数据
 */
export const setBuffer = BUFFER.set
/**
 * 链接转化为二维码
 * @param text 链接
 * @param localpath 可选,要保存的路径
 * @returns buffer
 */
export const createQrcode = BUFFER.qrcode
/**
 * 异步请求图片
 * @param url 网络地址
 * @returns buffer
 */
export const getUrlbuffer = BUFFER.getUrl
/**
 * 读取本地图片
 * @param val
 * @returns
 */
export const getPathBuffer = BUFFER.getPath

/**
 * 创建form
 * @param image
 * @param name
 * @returns
 */
export async function createPicFrom(image: any, name = 'image.jpg') {
  let picData: Readable | Buffer[]
  // 是 string
  if (typeof image === 'string') {
    if (!existsSync(image)) return false
    if (!name) name = basename(image)
    picData = createReadStream(image)
    // 是 buffer
  } else if (Buffer.isBuffer(image)) {
    if (!name) name = 'file.' + (await fileTypeFromBuffer(image)).ext
    picData = new Readable()
    picData.push(image)
    picData.push(null)
    // 是 文件流
  } else if (isReadable(image)) {
    if (!name) name = 'file.' + (await fileTypeFromStream(image)).ext
    picData = image
  } else {
    return false
  }
  return { picData, image, name }
}
