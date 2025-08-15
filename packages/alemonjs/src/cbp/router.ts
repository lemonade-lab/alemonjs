import KoaRouter from 'koa-router'
import fs from 'fs'
import path, { join } from 'path'
import mime from 'mime-types'

const router = new KoaRouter({
  prefix: '/'
})

// 响应服务在线
router.get('api/online', ctx => {
  ctx.status = 200
  ctx.body = {
    code: 200,
    message: 'service online',
    data: null
  }
})

router.get('app/:path*', async ctx => {
  const __dirname = process.cwd()
  if (ctx.path.startsWith('/api')) {
    try {
      const dir = join(__dirname, 'src', 'route', ctx.path)
      const apiModule = await import(dir)
      await apiModule.default(ctx)
    } catch (err) {
      console.error(`Error handling API request ${ctx.path}:`, err)
      ctx.status = 500
      ctx.body = {
        code: 500,
        message: `处理 API 请求时发生错误。`,
        error: err.message
      }
    }
    return
  }

  const resourcePath = ctx.params?.path ? ctx.params.path : 'index.html' // 默认为 index.html
  const fullPath = path.join(__dirname, resourcePath)
  try {
    // 返回文件
    const file = await fs.promises.readFile(fullPath)
    const mimeType = mime.lookup(fullPath) || 'application/octet-stream'
    ctx.set('Content-Type', mimeType) // 自动设置响应头
    ctx.body = file
    ctx.status = 200
  } catch (err) {
    if (err.status === 404) {
      ctx.status = 404
      ctx.body = {
        code: 404,
        message: `资源中未找到。`,
        data: null
      }
    } else {
      ctx.status = 500
      ctx.body = {
        code: 500,
        message: `加载资源时发生服务器错误。`,
        error: err.message
      }
    }
  }
})

router.get('apps/:name/:path*', async ctx => {
  const __dirname = process.cwd()
  const appName = ctx.params.name

  if (ctx.path.startsWith('/api')) {
    try {
      const dir = join(__dirname, 'packages', appName, 'src', 'route', ctx.path)
      const apiModule = await import(dir)
      await apiModule.default(ctx)
    } catch (err) {
      console.error(`Error handling API request ${ctx.path}:`, err)
      ctx.status = 500
      ctx.body = {
        code: 500,
        message: `处理 API 请求时发生错误。`,
        error: err.message
      }
    }
    return
  }

  const resourcePath = ctx.params?.path ? ctx.params.path : 'index.html' // 默认为 index.html
  const fullPath = path.join(__dirname, 'packages', appName, resourcePath)
  try {
    // 返回文件
    const file = await fs.promises.readFile(fullPath)
    const mimeType = mime.lookup(fullPath) || 'application/octet-stream'
    ctx.set('Content-Type', mimeType) // 自动设置响应头
    ctx.body = file
    ctx.status = 200
  } catch (err) {
    if (err.status === 404) {
      ctx.status = 404
      ctx.body = {
        code: 404,
        message: `资源 '${resourcePath}' 在子应用 '${appName}' 中未找到。`,
        data: null
      }
    } else {
      ctx.status = 500
      ctx.body = {
        code: 500,
        message: `加载子应用 '${appName}' 资源时发生服务器错误。`,
        error: err.message
      }
      console.error(`Error serving resource ${fullPath}:`, err)
    }
  }
})

export default router
