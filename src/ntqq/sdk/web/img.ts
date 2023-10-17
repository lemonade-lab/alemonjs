import { type Context } from 'koa'
import { createReadStream, writeFileSync, readdirSync, unlinkSync } from 'fs'
import { join } from 'path'
import { fileTypeFromBuffer } from 'file-type'
import { getWebConfig } from '../config.js'
/**
 * 处理图片请求
 * @param ctx
 */
export function getLocalImg(ctx: Context) {
  const cfg = getWebConfig()
  const filename = ctx.params.filename
  const imagePath = join(cfg.IMAGE_DIR as string, filename)
  try {
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
export function autoClearImages(time: number) {
  /**
   * 得到配置
   */
  const cfg = getWebConfig()
  /**
   * 启动清除
   */
  setInterval(() => {
    const files = readdirSync(cfg.IMAGE_DIR as string)
    for (const file of files) {
      const extname = file.split('.').pop()
      if (
        ['jpg', 'jpeg', 'png', 'gif'].includes(
          (extname as string).toLowerCase()
        )
      ) {
        const filePath = join(cfg.IMAGE_DIR as string, file)
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
  /**
   * 检查参数是否有效
   */
  if (!img) return false
  /**
   * 得到配置
   */
  const cfg = getWebConfig()
  /**
   * 生成文件名
   */
  const filename = `${Math.floor(Math.random() * (cfg.img_size as number))}.${
    (await fileTypeFromBuffer(img))?.ext
  }`
  /**
   * 文件路径
   */
  const imagePath = join(cfg.IMAGE_DIR as string, filename)
  /**
   * 将图片保存到文件系统中
   */
  writeFileSync(imagePath, img)
  return `${cfg.img_url}/${filename}`
}
