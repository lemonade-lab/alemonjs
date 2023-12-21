import { existsSync, readFileSync, createReadStream } from 'fs'
import axios from 'axios'
import { join } from 'path'
import { Readable, isReadable } from 'stream'
import { basename } from 'path'
import { fileTypeFromBuffer, fileTypeFromStream } from 'file-type'

/**
 * 异步请求图片
 * @param url 网络地址
 * @returns buffer
 */
export async function getUrlbuffer(url: string) {
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
export function getPathBuffer(val: string) {
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
 * 创建form
 * @param image
 * @param name
 * @returns
 */
export async function createPicFrom(image: any, name = 'image.jpg') {
  let picData: Readable | Buffer[]
  // 是 string
  if (typeof image === 'string') {
    if (!existsSync(image)) {
      return false
    }
    if (!name) {
      name = basename(image)
    }
    picData = createReadStream(image)
    // 是 buffer
  } else if (Buffer.isBuffer(image)) {
    if (!name) {
      name = 'file.' + (await fileTypeFromBuffer(image)).ext
    }
    picData = new Readable()
    picData.push(image)
    picData.push(null)
    // 是 文件流
  } else if (isReadable(image)) {
    if (!name) {
      name = 'file.' + (await fileTypeFromStream(image)).ext
    }
    picData = image
  } else {
    return false
  }
  return { picData, image, name }
}
