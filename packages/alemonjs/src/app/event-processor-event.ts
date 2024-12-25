/**
 * @fileoverview 消息处理快
 * 登录模块向核心模块发送数据
 * 核心模块调用模块索引
 * @module processor
 * @author ningmengchongshui
 */
import { AEvents } from '../typing/event/map'
import { expendMiddleware } from './event-processor-middleware'
import { isAsyncFunction } from 'util/types'
import { OnResponseValue } from '../typing/event'
import { expendObserver } from './event-processor-observer'

/**
 * 消息体处理机制
 * @param event
 * @param key
 */
export const expendEvent = async <T extends keyof AEvents>(valueEvent: AEvents[T], select: T) => {
  // 得到所有 apps
  const StoreResponse = [...global.storeResponse]

  // 得到对应类型的消息
  const StoreResponseGather = [...global.storeResponseGather[select]]

  let valueI = 0
  let valueJ = 0

  /**
   * 下一步
   * @returns
   */
  const next = () => {
    // i 结束了
    if (valueI >= StoreResponse.length) {
      // j 结束了
      if (valueJ >= StoreResponseGather.length) {
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
   * 执行 i
   * @returns
   */
  const calli = async () => {
    // 调用完了
    if (valueI >= StoreResponse.length) {
      // 开始调用j
      next()
      return
    }
    valueI++
    const file = StoreResponse[valueI - 1]
    if (!file?.path) {
      // 继续
      next()
      return
    }
    //
    try {
      const obj: {
        default: OnResponseValue<T>
      } = await import(`file://${file.path}`)
      const res = obj?.default

      // 如果是数组
      if (Array.isArray(res.select)) {
        // 没有匹配到
        if (!res.select.includes(select)) {
          // 继续
          next()
          return
        }
        // 如果不是数组
      } else {
        // 没有匹配到
        if (res?.select !== select) {
          // 继续
          next()
          return
        }
        // 不是数组写法的。会触发分类
        // 判断是否已经分类
        if (!global.storeResponseGather[select].find(v => v.path === file.path)) {
          // 得到index
          const index = global.storeResponse.findIndex(v => v.path === file.path)
          // 分类
          global.storeResponse.splice(index, 1)
          // 转移存储
          global.storeResponseGather[select].push({
            source: file.source,
            dir: file.dir,
            path: file.path,
            name: file.name,
            value: {
              select: res.select
            }
          })
        }
      }
      // 这里是否继续时 next 说了算
      if (isAsyncFunction(res?.current)) {
        res?.current(valueEvent, next)
      } else {
        res?.current(valueEvent, next)
      }
    } catch (err) {
      // 不再继续
      logger.error(err)
    }
  }

  /**
   * 被分类好的
   * @returns
   */
  const callj = async () => {
    // 调用完了
    if (valueJ >= StoreResponseGather.length) {
      return
    }
    valueJ++
    const file = StoreResponseGather[valueJ - 1]
    if (!file?.path) {
      next()
      return
    }

    try {
      const obj: {
        default: OnResponseValue<T>
      } = await import(`file://${file.path}`)
      const res = obj?.default
      if (isAsyncFunction(res?.current)) {
        res?.current(valueEvent, next)
      } else {
        res?.current(valueEvent, next)
      }
    } catch (err) {
      logger.error(err)
    }
    //
  }

  const nextObserver = () => {
    // 先从观察者开始
    expendObserver(valueEvent, select, next)
  }

  // 使用中间件修正 event
  expendMiddleware(valueEvent, select, nextObserver)
}
