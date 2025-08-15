import KoaRouter from 'koa-router'
import fs, { existsSync } from 'fs'
import path, { dirname, join } from 'path'
import mime from 'mime-types'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

const mainDirMap = new Map<string, string>()

const formatPath = path => {
  const pates = path.split('/')
  const lastPath = pates[pates.length - 1]
  if (lastPath.includes('.')) {
    return path
  }
  path += '.html'
  return path
}

// 输入一个文件路径。
const getModuelFile = (dir: string) => {
  const dirMap = {
    '.js': `${dir}.js`,
    '.jsx': `${dir}.jsx`,
    '.mjs': `${dir}.mjs`,
    '.cjs': `${dir}.cjs`,
    '/index.js': `${dir}/index.js`,
    '/index.jsx': `${dir}/index.jsx`,
    '/index.mjs': `${dir}/index.mjs`,
    '/index.cjs': `${dir}/index.cjs`,
    '.ts': `${dir}.ts`,
    '.tsx': `${dir}.tsx`,
    '/index.ts': `${dir}/index.ts`,
    '/index.tsx': `${dir}/index.tsx`
  }
  for (const key in dirMap) {
    const filePath = dirMap[key as keyof typeof dirMap]
    if (existsSync(filePath) && fs.statSync(filePath)) {
      return filePath
    }
  }
  return ''
}

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

router.get('app/{*path}', async ctx => {
  if (!process.env.input) {
    ctx.status = 400
    ctx.body = {
      code: 400,
      message: '没有主要入口文件',
      data: null
    }
    return
  }
  const rootPath = process.cwd()
  if (ctx.path.startsWith(`/app/api`)) {
    let mainPath = join(rootPath, process.env.input)
    // 路径
    if (!existsSync(mainPath)) {
      ctx.status = 400
      ctx.body = {
        code: 400,
        message: '未找到主要入口文件',
        data: null
      }
      return
    }
    const mainDir = dirname(mainPath)
    try {
      const dir = join(mainDir, 'route', ctx.path)
      if (!existsSync(dir)) {
        ctx.status = 404
        ctx.body = {
          code: 404,
          message: `API 'route/${ctx.path}' 未找到。`,
          data: null
        }
        return
      }
      const dirs = dir.split('/')
      const fileName = dirs[dirs.length - 1]
      if (fileName.includes('.')) {
        ctx.status = 404
        ctx.body = {
          code: 404,
          message: `API 'route/${ctx.path}' 未找到。`,
          data: null
        }
        return
      }
      const modulePath = getModuelFile(dir)
      if (!modulePath) {
        ctx.status = 404
        ctx.body = {
          code: 404,
          message: `API 'route/${ctx.path}' 未找到。`,
          data: null
        }
        return
      }
      const apiModule = await import(modulePath)
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
  const resourcePath = formatPath(ctx.params?.path || 'index.html')
  const fullPath = path.join(rootPath, resourcePath)
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

router.get('apps/:app/{*path}', async ctx => {
  const appName = ctx.params.app
  const rootPath = process.cwd()
  const apiDir = `/apps/${appName}/api`
  if (ctx.path.startsWith(apiDir)) {
    try {
      if (!mainDirMap.has(appName)) {
        const mainPath = require.resolve(appName)
        // 不存在 main
        if (!existsSync(mainPath)) {
          ctx.status = 400
          ctx.body = {
            code: 400,
            message: '未找到主要入口文件',
            data: null
          }
          return
        }
        const mainDir = dirname(mainPath)
        mainDirMap.set(appName, mainDir)
      }
      const dir = join(mainDirMap.get(appName), 'route', ctx.path?.replace(apiDir, '/api') || '')
      const dirs = dir.split('/')
      const fileName = dirs[dirs.length - 1]
      if (fileName.includes('.')) {
        ctx.status = 404
        ctx.body = {
          code: 404,
          message: `API 'route/${ctx.path}' 未找到。`,
          data: null
        }
        return
      }
      const modulePath = getModuelFile(dir)
      if (!modulePath) {
        ctx.status = 404
        ctx.body = {
          code: 404,
          message: `API 'route/${ctx.path}' 未找到。`,
          data: null
        }
        return
      }
      const apiModule = await import(modulePath)
      await apiModule.default(ctx)
    } catch (err) {
      logger.warn(`Error handling API request ${ctx.path}:`, err?.message || '')
      ctx.status = 500
      ctx.body = {
        code: 500,
        message: `处理 API 请求时发生错误。`,
        error: err.message
      }
    }
    return
  }
  const resourcePath = formatPath(ctx.params?.path || 'index.html')
  const fullPath = path.join(rootPath, 'packages', appName, resourcePath)
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
      logger.warn(`Error handling API request ${ctx.path}:`, err?.message || '')
    }
  }
})

export default router
