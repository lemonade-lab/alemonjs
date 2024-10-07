import Koa from 'koa'
import KoaStatic from 'koa-static'
import Router from 'koa-router'
import { join } from 'path'
import mount from 'koa-mount'
import { Component } from '../component.js'
import { existsSync } from 'fs'

const PATH = process.cwd().replace(/\\/g, '\\\\')

const state = '/file'

type Options = {
  port?: number
  path?: string
  host?: string
  prefix?: string
}

const Dynamic = async (URL: string) => {
  const modulePath = `file://${URL}?update=${Date.now()}`
  return (await import(modulePath))?.default
}

/**
 *
 * @param Port
 */
export async function createServer(val?: Options) {
  const Com = new Component()
  const app = new Koa()
  const prefix = val?.prefix ?? ''
  const router = new Router({
    prefix
  })
  let URI = ''
  const configs = ['tsxp.config.tsx', 'tsxp.config.jsx', 'routes.config.tsx', 'routes.config.jsx']
  for (const config of configs) {
    const dir = join(process.cwd(), config)
    if (existsSync(dir)) {
      URI = dir
      break
    }
  }
  if (!URI) {
    console.log('未找到配置文件tsxp.config.tsx或routes.config.tsx')
    return
  }
  const routes = await Dynamic(URI)
  // 不存在
  if (!routes) return
  console.log('_______react-puppeteer_______')
  //
  for (const route of routes) {
    console.log(`http://${val?.host ?? '127.0.0.1'}:${val?.port ?? 8080}${prefix + route.url}`)
    router.get(route.url, async ctx => {
      // 动态加载
      const routes = await Dynamic(URI)
      // 不存在
      if (!routes) return
      // 不是数组
      if (!Array.isArray(routes)) return
      // 查找
      const item = routes.find(i => i.url == route.url)
      // 丢失了
      if (!item) return
      const options = item?.options ?? {}
      const HTML = Com.compile({
        ...options,
        file_create: false,
        server: true
      })
      // 置换为file请求
      ctx.body = HTML
    })
  }

  // static
  app.use(mount(state, KoaStatic(PATH)))

  // routes
  app.use(router.routes())

  // listen 8000
  app.listen(val?.port ?? 8080, () => {
    console.log(`Server is running on port  ${val?.port ?? 8080}`)
    console.log('自行调整默认浏览器尺寸 800 X 1280 100%')
    console.log('_______react-puppeteer_______')
  })
}
