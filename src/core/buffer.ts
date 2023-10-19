import { readFileSync } from 'fs'
import http from 'http'
import https from 'https'
import { join } from 'path'
import { createCanvas, loadImage } from 'canvas'

/**
 * 异步请求图片
 * @param url
 * @returns
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
 * @param path 根路径
 * @returns
 */
export function getPathBuffer(path: string): Buffer {
  // 读取本地图片
  const image = readFileSync(join(process.cwd(), path))
  // 将图片转换为 Buffer 对象
  const BufferImage = Buffer.from(image)
  return BufferImage
}

/**
 * 压缩buffer图片
 * @param img
 * @param quality
 * @returns
 */
export async function compressImage(
  img: Buffer,
  quality: number
): Promise<Buffer> {
  const image = await loadImage(img)
  const canvas = createCanvas(image.width, image.height)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, 0, 0)
  ctx.canvas.toDataURL('image/jpeg', quality)
  return new Promise<Buffer>((resolve, reject) => {
    canvas.toBuffer((err: any, buf: Buffer) => {
      if (err) {
        reject(err)
      } else {
        resolve(buf)
      }
    }, 'image/jpeg')
  })
}
