/**
 * @fileoverview 消息处理快
 * 登录模块向核心模块发送数据
 * 核心模块调用模块索引
 * @module processor
 * @author ningmengchongshui
 */
import { AEvents, AEventsMessageEnum } from '../typing/event/map'
import { expendMiddleware } from './event-processor-mw'
import { isAsyncFunction } from 'util/types'
import { OnResponseValue } from '../typing/event'

/**
 * 消息体处理机制
 * @param event
 * @param key
 */
export const expendMessage = async <T extends keyof AEvents>(
  valueEvent: AEventsMessageEnum,
  select: T
) => {
  // 如果不存在。则创建 storeObserver[key]
  if (!global.storeObserver[select]) global.storeObserver[select] = []
  // 得到所有 apps
  const messageFiles = [...global.storeResponse]
  // 得到对应类型的消息
  const messages = [...global.storeMiddlewareGather[select]]

  let valueI = 0
  let valueJ = 0
  let valueN = 0

  // 使用中间件修正 event
  const event: AEventsMessageEnum = (await expendMiddleware(valueEvent as any, select)) as any

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
    if (valueN >= global.storeObserver[select].length) {
      // 订阅都检查过一遍。开始 next
      next()
      return
    }
    //
    valueN++
    // 发现订阅
    const item = global.storeObserver[select][valueN - 1]
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
    global.storeObserver[select][valueN - 1] = undefined
    // 放回来
    const Continue = () => {
      global.storeObserver[select][valueN - 1] = item
      // 直接结束才对
    }
    // 没有调用下一步。应该删除当前的 n ？
    // 有没有可能。按key来分。
    item.current(event, Continue)
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

    try {
      const obj: {
        default: OnResponseValue<T>
      } = await import(`file://${file.path}`)
      const res = obj?.default

      // 如果是数组
      if (Array.isArray(res.select)) {
        if (!res.select.includes(select)) {
          // 继续
          next()
          return
        }
      } else {
        if (res?.select !== select) {
          // 继续
          next()
          return
        }
        // 推送, 确保下次直接流向 key ，不再从头开始
        if (!global.storeMiddlewareGather[select].find(v => v.path === file.path)) {
          const valueKey = {
            source: file?.source,
            dir: file?.dir,
            path: file.path,
            name: file.name,
            value: {
              select: res?.select ?? select
            }
          }
          // update files and values
          const index = global.storeResponse.findIndex(v => v.path === file.path)
          global.storeResponse.splice(index, 1)
          global.storeMiddlewareGather[select].push(valueKey)
        }
      }
      // 这里是否继续时 next 说了算
      if (isAsyncFunction(res?.current)) {
        res?.current(event as any, next)?.catch(logger.error)
      } else {
        res?.current(event as any, next)
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
      const obj: {
        default: OnResponseValue<T>
      } = await import(`file://${file.path}`)
      const res = obj?.default
      // 这里是否继续时 next 说了算
      if (isAsyncFunction(res.current)) {
        res?.current(event as any, next)?.catch(logger.error)
      } else {
        res?.current(event as any, next)
      }
    } catch (err) {
      logger.error(err)
    }
    //
  }

  // 先从观察者开始
  nextObserver()
}
