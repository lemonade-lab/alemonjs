/**
 * @fileoverview 消息处理快
 * 登录模块向核心模块发送数据
 * 核心模块调用模块索引
 * @module processor
 * @author ningmengchongshui
 */
import { AEvents } from '../env'
import { ResStore } from './store'
import { expendMessage } from './event-processor-body'
import { expendMiddleware } from './event-processor-mw'
import { useParse } from '../post'
import { isAsyncFunction } from 'util/types'
export * from './store'

type EventMessageCreate = AEvents['message.create'] | AEvents['private.message.create']

/**
 * 消息体处理机制
 * @param event
 * @param key
 */
const expendEvent = async <T extends keyof AEvents>(valueEvent: AEvents, select: T) => {
  // 如果不存在。则创建 storeoberver
  if (!global.storeoberver) global.storeoberver = {}
  // 如果不存在。则创建 storeoberver[key]
  if (!global.storeoberver[select]) global.storeoberver[select] = []
  // 得到所有 apps
  const messageFiles = [...global.AppsFiles]
  // 得到对应类型的消息
  const messages = [...ResStore[select]]

  let valueI = 0
  let valueJ = 0
  let valueN = 0

  // 使用中间件修正 event
  const event: EventMessageCreate = (await expendMiddleware(valueEvent as any, select)) as any

  /**
   * 下一步
   * @returns
   */
  const next = () => {
    // i 结束了
    if (valueI >= messageFiles.length) {
      // j 结束了
      if (valueJ >= messages.length) {
        return
      }
      // 走 j，检查所有分毫类型的
      callj()
      return
    }
    // 走 i，检查所有 apps
    calli()
  }

  /**
   * 观察者下一步
   * @returns
   */
  const nextObserver = () => {
    // i 结束了
    if (valueN >= global.storeoberver[select].length) {
      // 订阅都检查过一遍。开始 next
      next()
      return
    }
    //
    valueN++
    // 发现订阅
    const item = global.storeoberver[select][valueN - 1]
    if (!item) {
      // 继续 next
      nextObserver()
      return
    }
    //
    for (const key in item.event) {
      // 只要发现不符合的，就继续
      if (item.event[key] !== event[key]) {
        // 不符合。继续 next。
        nextObserver()
        return
      }
    }
    // 设置为 undefined
    global.storeoberver[select][valueN - 1] = undefined
    // 放回来
    const Continue = () => {
      global.storeoberver[select][valueN - 1] = item
      // 直接结束才对
    }
    // 没有调用下一步。应该删除当前的 n ？
    // 有没有可能。按key来分。
    item.callback(event, { next: Continue })
    //
  }

  /**
   * 执行 i
   * @returns
   */
  const calli = async () => {
    // 调用完了
    if (valueI >= messageFiles.length) {
      // 开始调用j
      next()
      return
    }
    valueI++
    const file = messageFiles[valueI - 1]
    if (!file?.path) {
      // 继续
      next()
      return
    }
    //
    try {
      const obj = await import(`file://${file.path}`)
      const res = obj?.default

      if (Array.isArray(res.select)) {
        if (!res.select.includes(select)) {
          // 继续
          next()
          return
        }

        //
      } else {
        if (res?.select !== select) {
          // 继续
          next()
          return
        }

        if (!ResStore[select].find(v => v.path === file.path)) {
          const valueKey = {
            dir: file?.dir,
            path: file.path,
            name: file.name,
            value: {
              reg: res?.reg,
              select: res?.select ?? select,
              priority: res?.priority ?? 0
            }
          }
          // update files and values
          const index = global.AppsFiles.findIndex(v => v.path === file.path)
          global.AppsFiles.splice(index, 1)
          ResStore[select].push(valueKey)
        }
      }

      // 这里是否继续时 next 说了算
      if (isAsyncFunction(res?.callback)) {
        res?.callback(event, { next })?.catch(logger.error)
      } else {
        res?.callback(event, { next })
      }
    } catch (err) {
      // 不再继续
      logger.error(err)
    }
  }

  const callj = async () => {
    // 调用完了
    if (valueJ >= messages.length) {
      return
    }
    valueJ++
    const file = messages[valueJ - 1]
    if (!file?.path) {
      next()
      return
    }

    try {
      if (!file.value) {
        const obj = await import(`file://${file.path}`)
        const res = obj?.default
        // 这里是否继续时 next 说了算
        if (isAsyncFunction(res?.callback)) {
          await res?.callback(event, { next })?.catch(logger.error)
        } else {
          res?.callback(event, { next })
        }
      } else {
        const obj = await import(`file://${file.path}`)
        const res = obj?.default
        if (isAsyncFunction(res?.callback)) {
          await res?.callback(event, { next })?.catch(logger.error)
        } else {
          res?.callback(event, { next })
        }
      }
    } catch (err) {
      logger.error(err)
    }
    //
  }

  // 先从观察者开始
  nextObserver()
}

/**
 *
 * @param value
 * @param select
 */
const Log = <T extends keyof AEvents>(value: AEvents[T], select: T) => {
  const logs = [`[${select}]`]
  if (typeof value['ChannelId'] == 'string' && value['ChannelId'] != '') {
    logs.push(`[${value['ChannelId']}]`)
  }
  if (typeof value['UserId'] == 'string' && value['UserId'] != '') {
    logs.push(`[${value['UserId']}]`)
  }
  if (Array.isArray(value['Megs'])) {
    const txt = useParse(value['Megs'], 'Text')
    if (typeof txt == 'string' && txt != '') {
      logs.push(`[${txt}]`)
    }
  }
  logger.info(logs.join(''))
}

/**
 * 消息处理器
 * @param value
 * @param event
 * @returns
 */
export const OnProcessor = <T extends keyof AEvents>(value: AEvents[T], select: T) => {
  // 打印
  Log(value, select)
  // 选择处理
  switch (select) {
    case 'message.create':
      // 处理公有消息
      expendMessage(value as EventMessageCreate, 'message.create')
      break
    case 'private.message.create':
      // 处理私有消息
      expendMessage(value as EventMessageCreate, 'private.message.create')
      break
    default: {
      // 无消息体处理
      expendEvent(value as any, select)
      break
    }
  }
  return
}
