import { isEmpty } from 'lodash-es'
import { ARG, MSG, SLICING } from './cache/index.js'
import { type AMessage } from './typings.js'
import { Conversation } from './conversation.js'
import { APlugin } from './plugin/index.js'
import { CALL } from './call.js'
import { funcBase } from './plugin/types.js'
import { APPLICATION, CommandType } from './application.js'

class Response {
  /**
   * 指令匹配
   * @param e alemonjs message
   * @returns 是否处理完成
   */
  async message(e: AMessage) {
    if (process.env?.ALEMONJS_MESSAGE == 'dev') console.info('e', e)
    /**
     * 对话机
     */
    const guild_state = await Conversation.getState(e.guild_id)
    const channel_state = await Conversation.getState(e.channel_id)
    const user_state = await Conversation.getState(e.user_id)

    if (guild_state || channel_state || user_state) {
      const guild_handler = Conversation.get(e.guild_id)
      if (guild_handler) await guild_handler(e, guild_state)
      const channel_handler = Conversation.get(e.channel_id)
      if (channel_handler) await channel_handler(e, channel_state)
      const user_handler = Conversation.get(e.user_id)
      if (user_handler) await user_handler(e, user_state)
      return true
    }

    let t = true

    /**
     * 回调系统
     */
    for (const app of CALL.get('MESSAGES')) {
      if (t === false) break
      try {
        // app.call
        const back = await app.call(e)
        if (back != false) t = false
      } catch (err) {
        console.error(
          `[${e.event}]`,
          `[${app.call}]`,
          `[${false}]\n`,
          `[${err}]`
        )
        continue
      }
    }

    const APPCACHE: {
      [key: string]: APlugin
    } = {}

    const ARGCACHE: {
      [key: string]: any[]
    } = {}

    /**
     * 上下文
     */
    for (const item in APPLICATION.CommandApp) {
      const { name, APP } = APPLICATION.CommandApp[item]
      const AppFnc = MSG.get(name)
      const AppArg = ARG.get(name)
      const arr = SLICING.get(name)
      if (arr && Array.isArray(arr) && arr.length != 0) {
        for (const item of arr) {
          e.msg = e.msg.replace(item.reg, item.str)
        }
      }

      try {
        if (typeof AppFnc == 'function') e = await AppFnc(e)
        if (typeof AppArg == 'function') ARGCACHE[item] = await AppArg(e)
        const app = new APP(e)
        // 设置this
        app.e = e
        // 如果存在用户上下文
        if (app.getContext) {
          // 得到缓存
          const context = app.getContext()
          // 是否为 null && undefined && '' && [] && {}
          if (!isEmpty(context)) {
            // 得到缓存中的e消息
            for (const fnc in context) {
              // 丢给自己
              await (app[fnc] as funcBase)(context[fnc])
            }
            return
          }
        }
        // 如果存在频道上下文
        if (app.getContextGroup) {
          // 得到缓存
          const context = app.getContextGroup()
          // 是否为 null && undefined && '' && [] && {}
          if (!isEmpty(context)) {
            // 得到缓存中的e消息
            for (const fnc in context) {
              // 丢给自己
              await (app[fnc] as funcBase)(context[fnc])
              return
            }
          }
        }
        APPCACHE[item] = app
      } catch (err) {
        console.error('APP ERR', err)
        return
      }
    }

    /**
     *  撤回事件 || 匹配不到事件 || 大正则不匹配
     */
    if (!APPLICATION.Command[e.event] || !APPLICATION.mergedRegex.test(e.msg))
      return true

    /**
     * 循环所有指令
     */
    for (const data of APPLICATION.Command[e.event]) {
      if (
        e.typing != data.typing ||
        data.reg === undefined ||
        !data.reg.test(e.msg)
      ) {
        continue
      }
      try {
        const res = await (APPCACHE[data.APP][data.fncName] as funcBase)(
          e,
          ...(ARGCACHE[data.APP] ?? [])
        )
          .then(this.info(data))
          .catch(this.logErr(data))
        if (typeof res != 'boolean') {
          e.reply(res).catch(err => {
            console.error('APP REPLY', err)
          })
        }
        if (res != false) break
      } catch (err) {
        this.logErr(data)(err)
        return false
      }
    }
    return true
  }

  async event(e: AMessage) {
    if (process.env?.ALEMONJS_MESSAGE == 'dev') console.info('e', e)

    if (!APPLICATION.CommandNotMessage[e.event]) return true

    /**
     * 回调系统
     */
    const event = CALL.get(e.event)
    for (const app of event) {
      try {
        // app.call
        const back = await app.call(e)
        if (back === true) break
      } catch (err) {
        console.error(
          `[${e.event}]`,
          `[${app.call}]`,
          `[${false}]\n`,
          `[${err}]`
        )
        continue
      }
    }

    const APPCACHE: {
      [key: string]: APlugin
    } = {}

    const ARGCACHE: {
      [key: string]: any[]
    } = {}

    for (const item in APPLICATION.CommandApp) {
      const { name, APP } = APPLICATION.CommandApp[item]
      const AppFnc = MSG.get(name)
      const AppArg = ARG.get(name)
      try {
        if (typeof AppFnc == 'function') e = await AppFnc(e)
        if (typeof AppArg == 'function') ARGCACHE[item] = await AppArg(e)
        const app = new APP(e)
        app.e = e
        APPCACHE[item] = app
      } catch (err) {
        console.error('APP', err)
        return
      }
    }

    // 循环查找
    for (const data of APPLICATION.CommandNotMessage[e.event]) {
      if (e.typing != data.typing) continue
      try {
        const res = await (APPCACHE[data.APP][data.fncName] as funcBase)(
          e,
          ...(ARGCACHE[data.APP] ?? [])
        )
          .then(this.info(data))
          .catch(this.logErr(data))
        if (typeof res != 'boolean') {
          e.reply(res).catch(err => {
            console.error('APP REPLY', err)
          })
        }
        if (res != false) break
      } catch (err) {
        this.logErr(data)(err)
        continue
      }
    }
    return true
  }

  logErr(data: CommandType) {
    return (err: any) => {
      console.error(
        `[${data.event}]`,
        `[${data.fncName}]`,
        `[${false}]\n`,
        `[${err}]`
      )
      return false
    }
  }

  info(data: CommandType) {
    return (res: boolean) => {
      console.info(`[${data.event}]`, `[${data.fncName}]`, `[${true}]`)
      return res
    }
  }
}

/**
 * 响应message
 */
export const RESPONSE = new Response()
