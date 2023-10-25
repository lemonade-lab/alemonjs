import { type Context } from 'koa'
import { createReadStream, writeFileSync, readdirSync, unlinkSync } from 'fs'
import { join } from 'path'
import { fileTypeFromBuffer } from 'file-type'
import { getServerConfig } from './config.js'
import { getIP } from '../core/index.js'
/**
 * 处理图片请求
 * @param ctx
 */
export function getLocalImg(ctx: Context) {
  // 缓存地址
  const imgDir = getServerConfig('imgDir')
  // 文件名
  const filename = ctx.params.filename
  // 图片地址
  const imagePath = join(process.cwd(), imgDir, filename)
  try {
    // 读取图片
    const stream = createReadStream(imagePath)
    ctx.set('Content-Type', 'image/jpeg')
    ctx.body = stream
  } catch (error) {
    ctx.status = 404
    ctx.body = 'Not Found'
  }
}

/**
 * 自动清除机制
 * 清除挂载下的所有图片
 * 'jpg', 'jpeg', 'png', 'gif'
 * @param time
 */
export function autoClearImages(time = 300000) {
  const imgDir = getServerConfig('imgDir')
  // 启动清除
  setInterval(() => {
    const files = readdirSync(join(process.cwd(), imgDir))
    for (const file of files) {
      const extname = file.split('.').pop()
      if (
        ['jpg', 'jpeg', 'png', 'gif'].includes(
          (extname as string).toLowerCase()
        )
      ) {
        const filePath = join(process.cwd(), imgDir, file)
        unlinkSync(filePath)
      }
    }
  }, time)
}

/**
 * 存储图片
 * @param img buffer
 * @returns
 */
export async function setLocalImg(img: Buffer) {
  // 检查参数是否有效
  if (!Buffer.isBuffer(img)) return false
  //得到配置
  const imgDir = getServerConfig('imgDir')
  const imgRouter = getServerConfig('imgRouter')
  const imgSize = getServerConfig('imgSize')
  const port = getServerConfig('port')
  const http = getServerConfig('http')
  const ip = getIP()

  // 生成文件名
  const filename = `${Math.floor(Math.random() * imgSize)}.${
    (await fileTypeFromBuffer(img))?.ext
  }`

  // 文件路径
  const imagePath = join(process.cwd(), imgDir, filename)

  // 将图片保存到文件系统中
  writeFileSync(imagePath, img)
  const url = `${http}://${ip}:${port}${imgRouter}/${filename}`
  console.log('url', url)
  return url
}
