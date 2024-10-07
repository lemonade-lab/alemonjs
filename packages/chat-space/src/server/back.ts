import { createReadStream, existsSync } from 'fs'
import { join } from 'path'
import { FileConfig } from './config.js'
import mime from 'mime-types'
import ARouter from 'koa-router'
/**
 * 得到文件路由
 * @returns
 */
export function getFileRouter() {
  const router = new ARouter()
  // 处理图片请求
  const imgRouter = FileConfig.get('fileRouter')
  router.get(`${imgRouter}/:filename`, async ctx => {
    const fileDir = FileConfig.get('fileDir')
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
    } catch (err) {
      console.error(err)
      ctx.status = 404
      ctx.body = 'Not Found'
    }
  })
  const addressRouter = FileConfig.get('addressRouter')
  router.get(`${addressRouter}`, async ctx => {
    const address = ctx.query.address // 从请求中获取 address 参数
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
    } catch (err) {
      console.error(err)
      ctx.status = 500
      ctx.body = 'Internal Server Error'
    }
  })
  return router
}
