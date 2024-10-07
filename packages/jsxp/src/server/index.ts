import Koa from 'koa'
import KoaStatic from 'koa-static'
import Router from 'koa-router'
import { join } from 'path'
import mount from 'koa-mount'
import { Component } from '../component.js'
import { existsSync } from 'fs'
import { JSXPOptions } from '../types.js'
const Dynamic = async (URL: string) => {
  const modulePath = `file://${URL}?update=${Date.now()}`
  return (await import(modulePath))?.default
}
/**
 *
 * @param Port
 */
export async function createServer() {
  let URI = ''

  //
  const configs = ['jsxp.config.tsx', 'jsxp.config.jsx']

  for (const config of configs) {
    const dir = join(process.cwd(), config)
    if (existsSync(dir)) {
      URI = dir
      break
    }
  }

  if (!URI) {
    console.log('未找到配置文件jsxp.config.tsx')
    return
  }

  //
  const config: JSXPOptions = await Dynamic(URI)

  if (!config) return

  const Com = new Component()
  const app = new Koa()
  const prefix = config?.prefix ?? ''
  const router = new Router({
    prefix
  })

  console.log('_______jsxp_______')

  const routes = config?.routes
  if (!routes) return

  //
  for (const url in routes) {
    console.log(`http://${config?.host ?? '127.0.0.1'}:${config?.port ?? 8080}${prefix + url}`)
    router.get(url, async ctx => {
      // 重新加载
      const config = await Dynamic(URI)

      // 不存在
      const routes = config?.routes
      if (!routes) return

      // 选择key
      const options = routes[url] as JSXPOptions['routes']['']
      // 丢失了
      if (!options) return

      // options
      const HTML = Com.compile({
        ...options,
        mountStatic: config?.mountStatic ?? '/file',
        create: false,
        server: true
      })

      //
      ctx.body = HTML
    })
  }

  const PATH = process.cwd().replace(/\\/g, '\\\\')
  const mountStatic = config?.mountStatic ?? '/file'

  // static
  app.use(mount(mountStatic, KoaStatic(PATH)))

  const statics = config?.statics ?? 'public'

  if (Array.isArray(statics)) {
    for (const item of statics) {
      app.use(KoaStatic(item))
    }
  } else {
    app.use(KoaStatic(statics))
  }

  // routes
  app.use(router.routes())

  // listen 8000
  app.listen(config?.port ?? 8080, () => {
    console.log(`Server is running on port ${config?.port ?? 8080}`)
    console.log('自行调整默认浏览器尺寸 800 X 1280 100%')
    console.log('_______jsxp_______')
  })
}
