import { type Context } from 'koa'
import {
  createReadStream,
  writeFileSync,
  readdirSync,
  unlinkSync,
  existsSync
} from 'fs'
import { join } from 'path'
import { fileTypeFromBuffer } from 'file-type'
import { getServerConfig } from './config.js'
import { getIP } from '../core/index.js'
import mime from 'mime-types'

/**
 * 存储文件
 * @param file buffer
 * @returns
 */
export async function getLocalFileByAddress(address: string) {
  // 检查文件是否存在
  if (!existsSync(join(process.cwd(), address))) {
    return false
  }
  const addressRouter = getServerConfig('addressRouter')
  const port = getServerConfig('port')
  const http = getServerConfig('http')
  let ip = getServerConfig('ip')
  if (ip == 'localhost') {
    const ipp = await getIP()
    if (ipp) ip = ipp
  }
  const url = `${http}://${ip}:${port}${addressRouter}?address=${address}`
  console.info('server url', url)
  return url
}

/**
 * 处理基于 address 参数的文件请求
 * @param ctx Koa 的上下文
 */
export async function getFileByAddress(ctx: Context) {
  const address = ctx.query.address // 从请求中获取 address 参数

  console.log('address', address)

  if (!address) {
    ctx.status = 400
    ctx.body = 'No address parameter provided'
    return
  }

  if (typeof address != 'string') {
    ctx.status = 400
    ctx.body = 'No address parameter provided'
    return
  }

  const filePath = join(process.cwd(), address)

  if (!existsSync(filePath)) {
    ctx.status = 404
    ctx.body = 'File not found'
    return
  }

  try {
    const stream = createReadStream(filePath)
    const mimeType = mime.lookup(filePath) || 'application/octet-stream'
    ctx.set('Content-Type', mimeType)
    ctx.body = stream
  } catch (error) {
    ctx.status = 500
    ctx.body = 'Internal Server Error'
  }
}

/**
 * 获取本地文件
 * @param ctx
 */
export function getLocalFile(ctx: Context) {
  const fileDir = getServerConfig('fileDir')
  const filename = ctx.params.filename
  const filePath = join(process.cwd(), fileDir, filename)
  try {
    // 读取文件
    const stream = createReadStream(filePath)
    // 根据文件扩展名确定 MIME 类型
    const mimeType = mime.lookup(filename) || 'application/octet-stream'
    // 设置正确的 Content-Type
    ctx.set('Content-Type', mimeType)
    ctx.body = stream
  } catch (error) {
    ctx.status = 404
    ctx.body = 'Not Found'
  }
}

/**
 * 自动清除机制
 * 清除挂载下的所有文件
 * @param time
 */
export function autoClearFiles(time = 300000) {
  const fileDir = getServerConfig('fileDir')
  setInterval(() => {
    const files = readdirSync(join(process.cwd(), fileDir))
    for (const file of files) {
      unlinkSync(join(process.cwd(), fileDir, file))
    }
  }, time)
}

/**
 * 存储文件
 * @param file buffer
 * @returns
 */
export async function setLocalFile(file: Buffer) {
  if (!Buffer.isBuffer(file)) return false
  const fileDir = getServerConfig('fileDir')
  const fileRouter = getServerConfig('fileRouter')
  const fileSize = getServerConfig('fileSize')
  const port = getServerConfig('port')
  const http = getServerConfig('http')
  let ip = getServerConfig('ip')
  if (ip == 'localhost') {
    const ipp = await getIP()
    if (ipp) ip = ipp
  }
  // 生成文件名（包括扩展名）
  const extension = (await fileTypeFromBuffer(file))?.ext || 'bin' // 使用 'bin' 作为默认扩展名

  const filename = `${Math.floor(Math.random() * fileSize)}.${extension}`

  const filePath = join(process.cwd(), fileDir, filename)

  console.info('server create', filePath)

  // 保存文件到文件系统
  writeFileSync(filePath, file)

  const url = `${http}://${ip}:${port}${fileRouter}/${filename}`

  console.info('server url', url)
  return url
}
