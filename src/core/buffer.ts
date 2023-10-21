import { readFileSync } from 'fs'
import http from 'http'
import https from 'https'
import { join } from 'path'

/**
 * 异步请求图片
 * @param url 网络地址
 * @returns buffer
 */
export function getUrlbuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    protocol
      .get(url, response => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to fetch image: ${response.statusCode}`))
        } else {
          const chunks: Buffer[] = []
          response.on('data', chunk => chunks.push(chunk))
          response.on('end', () => resolve(Buffer.concat(chunks)))
        }
      })
      .on('error', reject)
  })
}

/**
 * 读取本地图片
 * @param path 本地地址 /public/img/xx.png
 * @returns buffer
 */
export function getPathBuffer(path: string): Buffer {
  // 读取本地图片
  const image = readFileSync(join(process.cwd(), path))
  // 将图片转换为 Buffer 对象
  const BufferImage = Buffer.from(image)
  return BufferImage
}
