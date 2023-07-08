import { Request, Response } from 'express'
import { MysConfig } from '../config/index.js'
import { ip } from './ip.js'
import { createReadStream, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
/** 本地图片地址 */
const IMAGE_DIR = 'data/mys/img'
try {
  // 确保目录存在
  mkdirSync(IMAGE_DIR, { recursive: true })
} catch (err) {
  console.error(`Error creating directory: ${IMAGE_DIR}`, err)
}
/**
 * 处理图片请求
 * @param req
 * @param res
 */
export function getLocalImg(req: Request, res: Response) {
  // 得到参数
  const filename = req.params.filename
  // 读取图片
  const imagePath = join(IMAGE_DIR, filename)
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
export function setLocalImg(img: Buffer) {
  // 检查参数是否有效
  if (!img) {
    return false
  }
  const randomNum = Math.floor(Math.random() * 31)
  // 生成文件名
  const filename = `${randomNum}.jpg`
  // 文件路径
  const imagePath = join(IMAGE_DIR, filename)
  // 将图片保存到文件系统中
  writeFileSync(imagePath, img)
  // 返回保存的图片 URL
  const url = `http://${ip}:${MysConfig.host}/api/mys/img/${filename}`
  console.log(url)
  return url
}
