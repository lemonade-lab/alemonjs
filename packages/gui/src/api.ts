import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import Router from 'koa-router'
import { join } from 'path'
const router = new Router({
  prefix: '/api'
})

const dir = join(process.cwd(), 'public', 'config')

const messageDir = join(process.cwd(), 'public', 'message')

mkdirSync(dir, { recursive: true })
mkdirSync(messageDir, { recursive: true })

/**
 * channel.json
 */
const channelDir = join(dir, 'channel.json')
if (!existsSync(channelDir)) {
  writeFileSync(channelDir, JSON.stringify([]))
}

/**
 * private.json
 */

const privateDir = join(dir, 'private.json')
if (!existsSync(privateDir)) {
  writeFileSync(privateDir, JSON.stringify([]))
}

/**
 * channel.json
 */

// 新增
router.post('/channel', async ctx => {
  const data = ctx.request.body as {}
  const dir = readFileSync(channelDir, 'utf-8')
  const json = JSON.parse(dir)
  json.push(data)
  writeFileSync(channelDir, JSON.stringify(json))
  ctx.status = 200
})

// 删除
router.delete('/channel', async ctx => {
  // 发送 MessageId
  const data = ctx.request.body as {
    MessageId: string
  }
  if (!data.MessageId) {
    ctx.status = 400
    return
  }
  const dir = readFileSync(channelDir, 'utf-8')
  const json = JSON.parse(dir)
  const index = json.findIndex((item: any) => item.MessageId === data.MessageId)
  json.splice(index, 1)
  writeFileSync(channelDir, JSON.stringify(json))
  ctx.status = 200
})

router.delete('/channel/all', async ctx => {
  writeFileSync(channelDir, JSON.stringify([]))
  ctx.status = 200
})

/**
 * private.json
 */

// 新增
router.post('/private', async ctx => {
  const data = ctx.request.body as {}
  const dir = readFileSync(privateDir, 'utf-8')
  const json = JSON.parse(dir)
  json.push(data)
  writeFileSync(privateDir, JSON.stringify(json))
  ctx.status = 200
})

// 删除
router.delete('/private', async ctx => {
  // 发送 MessageId
  const data = ctx.request.body as {
    MessageId: string
  }
  if (!data.MessageId) {
    ctx.status = 400
    return
  }
  const dir = readFileSync(privateDir, 'utf-8')
  const json = JSON.parse(dir)
  const index = json.findIndex((item: any) => item.MessageId === data.MessageId)
  json.splice(index, 1)
  writeFileSync(privateDir, JSON.stringify(json))
  ctx.status = 200
})

router.delete('/private/all', async ctx => {
  writeFileSync(privateDir, JSON.stringify([]))
  ctx.status = 200
})

export default router
