import { Request, Response } from 'express'
import { createReadStream, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { getClientConfig } from './config.js'
/**
 * 处理图片请求
 * @param req
 * @param res
 */
export function getLocalImg(req: Request, res: Response) {
  const cfg = getClientConfig()
  // 得到参数
  const filename = req.params.filename
  // 读取图片
  const imagePath = join(cfg.IMAGE_DIR, filename)
  // 文件流
  const stream = createReadStream(imagePath)
  stream.on('open', () => {
    res.set('Content-Type', 'image/jpeg')
    stream.pipe(res)
  })
  stream.on('error', () => {
    res.status(404).send('Not Found')
  })
}

/**
 * 存储图片
 * @param Buffer 元素
 */
export async function setLocalImg(img: Buffer) {
  // 检查参数是否有效
  if (!img) {
    return false
  }
  // 得到配置
  const cfg = getClientConfig()
  // 确保目录存在
  mkdirSync(cfg.IMAGE_DIR, { recursive: true })
  // 随机图片
  const randomNum = Math.floor(Math.random() * 31)
  // 生成文件名
  const filename = `${randomNum}.jpg`
  // 文件路径
  const imagePath = join(cfg.IMAGE_DIR, filename)
  // 将图片保存到文件系统中
  writeFileSync(imagePath, img)
  const url = `${cfg.img_rul}/${filename}`
  console.log(url)
  return url
}
