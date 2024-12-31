/**
 * @fileoverview 消息处理快
 * 登录模块向核心模块发送数据
 * 核心模块调用模块索引
 * @module processor
 * @author ningmengchongshui
 */
import { AEvents } from '../typing/event/map'
import { isAsyncFunction } from 'util/types'
import { OnResponseValue } from '../typing/event'
import { Next } from '../global'

// 直接next下个周期。而不是下同级别的

/**
 * 消息体处理机制
 * @param event
 * @param key
 */
export const expendEvent = async <T extends keyof AEvents>(
  valueEvent: AEvents[T],
  select: T,
  next: Function
) => {
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
  const nextEvent: Next = (cn, ...cns) => {
    if (cn) {
      next(...cns)
      return
    }
    // i 结束了
    if (valueI >= StoreResponse.length) {
      // j 结束了
      if (valueJ >= StoreResponseGather.length) {
        next()
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
      nextEvent()
      return
    }
    valueI++
    const file = StoreResponse[valueI - 1]
    if (!file?.path) {
      // 继续
      nextEvent()
      return
    }
    //
    try {
      const obj: {
        default: OnResponseValue<T>
        regular?: RegExp | string
      } = await import(`file://${file.path}`)
      const res = obj?.default

      // 如果是数组
      if (Array.isArray(res.select)) {
        // 没有匹配到
        if (!res.select.includes(select)) {
          // 继续
          nextEvent()
          return
        }
        // 如果不是数组
      } else {
        // 没有匹配到
        if (res?.select !== select) {
          // 继续
          nextEvent()
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

      // 消息类型数据
      if (select == 'message.create' || select == 'private.message.create') {
        if (obj?.regular) {
          const reg = new RegExp(obj.regular)
          if (!reg.test(valueEvent['MessageText'])) {
            // 继续
            await nextEvent()
            return
          }
        }
      }

      if (!res.current) {
        // 继续
        await nextEvent()
        return
      }
      // 这里是否继续时 next 说了算
      if (isAsyncFunction(res?.current)) {
        res?.current(valueEvent, nextEvent)
      } else {
        res?.current(valueEvent, nextEvent)
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
      nextEvent()
      return
    }

    try {
      const obj: {
        default: OnResponseValue<T>
        regular?: RegExp | string
      } = await import(`file://${file.path}`)
      const res = obj?.default

      // 消息类型数据
      if (select == 'message.create' || select == 'private.message.create') {
        if (obj?.regular) {
          const reg = new RegExp(obj.regular)
          if (!reg.test(valueEvent['MessageText'])) {
            // 继续
            await nextEvent()
            return
          }
        }
      }

      if (!res.current) {
        // 继续
        await nextEvent()
        return
      }
      if (isAsyncFunction(res?.current)) {
        res?.current(valueEvent, nextEvent)
      } else {
        res?.current(valueEvent, nextEvent)
      }
    } catch (err) {
      logger.error(err)
    }
    //
  }

  nextEvent()
}
