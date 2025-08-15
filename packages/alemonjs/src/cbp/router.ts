import KoaRouter from 'koa-router'
import fs, { existsSync } from 'fs'
import path, { join, dirname } from 'path'
import mime from 'mime-types'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const mainDirMap = new Map()
const formatPath = (path: string) => {
  if (!path || path === '/') {
    return '/index.html'
  }
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
  const dirMap: Record<string, string> = {
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
    const filePath = dirMap[key]
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

router.all('app/{*path}', async ctx => {
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
  const apiPath = `/app/api`
  if (ctx.path.startsWith(apiPath)) {
    let mainPath = join(rootPath, process.env.input)
    // 路径
    if (!existsSync(mainPath)) {
      ctx.status = 400
      ctx.body = {
        code: 400,
        message: '未找到主要入口文件',
        data: 'existsSync input'
      }
      return
    }
    const mainDir = dirname(mainPath)
    try {
      const dir = join(mainDir, 'route', ctx.path?.replace(apiPath, '/api') || '')
      const dirs = dir.split('/')
      const fileName = dirs[dirs.length - 1]
      if (fileName.includes('.')) {
        ctx.status = 404
        ctx.body = {
          code: 404,
          message: `API '${ctx.path}' 未找到。`,
          data: 'existsSync route filename'
        }
        return
      }
      const modulePath = getModuelFile(dir)
      if (!modulePath) {
        ctx.status = 404
        ctx.body = {
          code: 404,
          message: `API '${ctx.path}' 未找到。`,
          data: 'existsSync modulePath'
        }
        return
      }
      const apiModule = await import(modulePath)
      if (!apiModule[ctx.method] || typeof apiModule[ctx.method] !== 'function') {
        ctx.status = 405
        return
      }
      await apiModule[ctx.method](ctx)
    } catch (err) {
      console.error(`Error handling API request ${ctx.path}`)
      ctx.status = 500
      ctx.body = {
        code: 500,
        message: `处理 API 请求时发生错误。`,
        error: err.message
      }
    }
    return
  }
  // 如果不是 get请求。即不响应
  if (ctx.method !== 'GET') {
    ctx.status = 405
    return
  }
  let root = ''
  const resourcePath = formatPath(ctx.params?.path)
  try {
    const pkg = require(path.join(rootPath, 'package.json')) || {}
    root = pkg.alemonjs?.web?.root || ''
  } catch (err) {
    ctx.status = 500
    ctx.body = {
      code: 500,
      message: `加载 package.json 时发生错误。`,
      error: err.message
    }
    return
  }
  const fullPath = root
    ? path.join(rootPath, root, resourcePath)
    : path.join(rootPath, resourcePath)
  try {
    // 返回文件
    const file = await fs.promises.readFile(fullPath)
    const mimeType = mime.lookup(fullPath) || 'application/octet-stream'
    ctx.set('Content-Type', mimeType) // 自动设置响应头
    ctx.body = file
    ctx.status = 200
  } catch (err) {
    if (err?.status === 404) {
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

router.all('app', async ctx => {
  ctx.redirect('/app/')
  return
})

router.all('apps/:app/{*path}', async ctx => {
  const appName = ctx.params.app
  const apiPath = `/apps/${appName}/api`
  if (ctx.path.startsWith(apiPath)) {
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
      const dir = join(mainDirMap.get(appName), 'route', ctx.path?.replace(apiPath, '/api') || '')
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
      if (!apiModule[ctx.method] || typeof apiModule[ctx.method] !== 'function') {
        ctx.status = 405
        return
      }
      await apiModule[ctx.method](ctx)
    } catch (err) {
      logger.warn(`Error request ${ctx.path}:`, err?.message || '')
      ctx.status = 500
      ctx.body = {
        code: 500,
        message: `处理 API 请求时发生错误。`,
        error: err.message
      }
    }
    return
  }

  // 如果不是 get请求。即不响应
  if (ctx.method !== 'GET') {
    ctx.status = 405
    return
  }
  // 不是 packages，而是 node_modules。需要是模块化
  const rootPath = path.join(process.cwd(), 'node_modules', appName)
  const resourcePath = formatPath(ctx.params?.path)
  let root = ''
  try {
    const pkg = require(`${appName}/package`) || {}
    root = pkg?.alemonjs?.web?.root || ''
  } catch (err) {
    ctx.status = 500
    ctx.body = {
      code: 500,
      message: `加载 package.json 时发生错误。`,
      error: err.message
    }
    return
  }
  const fullPath = root
    ? path.join(rootPath, root, resourcePath)
    : path.join(rootPath, resourcePath)
  try {
    // 返回文件
    const file = await fs.promises.readFile(fullPath)
    const mimeType = mime.lookup(fullPath) || 'application/octet-stream'
    ctx.set('Content-Type', mimeType) // 自动设置响应头
    ctx.body = file
    ctx.status = 200
  } catch (err) {
    if (err?.status === 404) {
      ctx.status = 404
      ctx.body = {
        code: 404,
        message: `资源 '${resourcePath}' 在子应用 '${appName}' 中未找到。`,
        data: null
      }
    } else {
      logger.warn(`Error request ${ctx.path}:`, err?.message || '')
      ctx.status = 500
      ctx.body = {
        code: 500,
        message: `加载子应用 '${appName}' 资源时发生服务器错误。`,
        error: err.message
      }
    }
  }
})
router.all('apps/:name', async ctx => {
  if (ctx.path === `/apps/${ctx.params.name}`) {
    ctx.redirect(`/apps/${ctx.params.name}/`)
    return
  }
})

export { router as default }
