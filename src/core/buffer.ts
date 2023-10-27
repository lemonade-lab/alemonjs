import { existsSync, readFileSync } from 'fs'
import axios from 'axios'
import { join } from 'path'

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
