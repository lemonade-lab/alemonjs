import { existsSync, mkdirSync, writeFileSync } from 'fs'
import Router from 'koa-router'
import { join } from 'path'
const router = new Router({
  prefix: '/api'
})

const dir = join(process.cwd(), 'public', 'config')

/**
 * 配置获取规则
 * /public/config/user.json
 * /public/config/guild.json
 * /public/config/channel.json
 */
const messageDir = join(process.cwd(), 'public', 'message')

/**
 * 消息获取规则
 * /public/message/guild_id/channel_id.json
 * /public/message/user_key.json
 */

mkdirSync(dir, { recursive: true })
mkdirSync(messageDir, { recursive: true })

/**
 * user.json
 */
const userdir = join(dir, 'user.json')
if (!existsSync(userdir)) {
  writeFileSync(userdir, JSON.stringify([]))
}

/**
 * guild.json
 */

const guildDir = join(dir, 'guild.json')
if (!existsSync(guildDir)) {
  writeFileSync(guildDir, JSON.stringify([]))
}

/**
 * channel.json
 */

const channelDir = join(dir, 'channel.json')
if (!existsSync(channelDir)) {
  writeFileSync(channelDir, JSON.stringify([]))
}

// 新增
router.post('/user', async ctx => {
  // --
})
// 更新
router.put('/user', async ctx => {
  //
})
// 删除
router.delete('/user', async ctx => {
  //
})

// 新增
router.post('/guild', async ctx => {
  //
})
// 更新
router.put('/guild', async ctx => {
  //
})
// 删除
router.delete('/guild', async ctx => {
  //
})

// 新增
router.post('/channel', async ctx => {
  //
})

// 更新
router.put('/channel', async ctx => {
  //
})

// 删除
router.delete('/channel', async ctx => {
  //
})

// 新增
router.post('/message', async ctx => {
  // ---
  // public
  // guild_id channel_id
  // const dir = join(messageDir, `${ctx.request.body.guild_id}-${ctx.request.body.channel_id}.json`)
  // ----
  // private
  // user_key
  // const userDir = join(messageDir, `${ctx.request.body.user_key}.json`)
})

// 删除
router.delete('/message', async ctx => {
  // --
  // public
  // guild_id channel_id
  // const dir = join(messageDir, `${ctx.request.body.guild_id}-${ctx.request.body.channel_id}.json`)
  // ----
  // private
  // user_key
  // const userDir = join(messageDir, `${ctx.request.body.user_key}.json`)
})

/**
 * api 进行数据交互。
 * 用户管理  增删改
 * 频道管理 增删改
 * 子频道管理 增删改
 * 消息管理 增删改
 * 所有的数据都存储在publi中
 */
export default router
