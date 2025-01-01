/**
 * @fileoverview 消息处理快
 * 登录模块向核心模块发送数据
 * 核心模块调用模块索引
 * @module processor
 * @author ningmengchongshui
 */
import { Events } from '../typing/event/map'
import { isAsyncFunction } from 'util/types'
import { OnResponseValue } from '../typing/event'
import { Next } from '../global'
import { useState } from './hook-use-state'

/**
 * 消息体处理机制
 * @param event
 * @param key
 */
export const expendEvent = async <T extends keyof Events>(
  valueEvent: Events[T],
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
      const app: {
        default: OnResponseValue<any, T>
        regular?: RegExp | string
        name?: string
      } = await import(`file://${file.path}`)

      if (!app?.default) {
        // 继续
        await nextEvent()
        return
      }

      if (!app.default?.current) {
        // 继续
        await nextEvent()
        return
      }

      // 检查状态
      if (app?.name) {
        const [state] = useState(app?.name)
        if (state == false) {
          // 继续
          await nextEvent()
          return
        }
      }

      // 如果是数组
      if (Array.isArray(app.default?.select)) {
        // 没有匹配到
        if (!app.default.select.includes(select)) {
          // 继续
          nextEvent()
          return
        }
        // 如果不是数组
      } else {
        // 没有匹配到
        if (app.default?.select !== select) {
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
              select: app.default.select
            }
          })
        }
      }

      // 消息类型数据
      if (select == 'message.create' || select == 'private.message.create') {
        if (app?.regular) {
          const reg = new RegExp(app.regular)
          if (!reg.test(valueEvent['MessageText'])) {
            // 继续
            await nextEvent()
            return
          }
        }
      }

      if (Array.isArray(app.default.current)) {
        let i = 0
        let T = true
        const start = async () => {
          if (i >= app.default.current.length) return
          // 不是真的
          if (!T) return
          if (isAsyncFunction(app.default.current[i])) {
            T = await app.default.current[i](valueEvent, nextEvent)
          } else {
            T = await app.default.current[i](valueEvent, nextEvent)
          }
          ++i
          await start()
        }
        await start()
      } else {
        // 这里是否继续时 next 说了算
        if (isAsyncFunction(app.default?.current)) {
          app.default?.current(valueEvent, nextEvent)
        } else {
          app.default?.current(valueEvent, nextEvent)
        }
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
      const app: {
        default: OnResponseValue<any, T>
        regular?: RegExp | string
        name?: string
        state?: [boolean, (value: boolean) => void]
      } = await import(`file://${file.path}`)

      if (!app?.default) {
        // 继续
        await nextEvent()
        return
      }

      if (!app.default?.current) {
        // 继续
        await nextEvent()
        return
      }

      // 检查状态
      if (app?.name) {
        const [state] = useState(app?.name)
        if (state == false) {
          // 继续
          await nextEvent()
          return
        }
      }

      // 消息类型数据
      if (select == 'message.create' || select == 'private.message.create') {
        if (app?.regular) {
          const reg = new RegExp(app.regular)
          if (!reg.test(valueEvent['MessageText'])) {
            // 继续
            await nextEvent()
            return
          }
        }
      }

      if (Array.isArray(app.default.current)) {
        let i = 0
        let T = true
        const start = async () => {
          if (i >= app.default.current.length) return
          // 不是真的事件 退出
          if (!T) return
          if (isAsyncFunction(app.default.current[i])) {
            T = await app.default.current[i](valueEvent, nextEvent)
          } else {
            T = await app.default.current[i](valueEvent, nextEvent)
          }
          ++i
          await start()
        }
        await start()
      } else {
        // 这里是否继续时 next 说了算
        if (isAsyncFunction(app.default?.current)) {
          app.default?.current(valueEvent, nextEvent)
        } else {
          app.default?.current(valueEvent, nextEvent)
        }
      }

      //
    } catch (err) {
      logger.error(err)
    }
    //
  }

  nextEvent()
}
