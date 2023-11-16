import { createReadStream, existsSync } from 'fs'
import { join } from 'path'
import { type Context } from 'koa'
import mime from 'mime-types'
import { getServerConfig } from './config.js'

/**
 * 响应指定本地文件
 * @param ctx
 * @returns
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
  let filePath: string
  if (existsSync(address)) {
    filePath = address
  } else {
    filePath = join(process.cwd(), address)
  }
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
 * 响应静态文件
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
