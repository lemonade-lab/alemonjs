/**
 * @fileoverview 消息处理快
 * 登录模块向核心模块发送数据
 * 核心模块调用模块索引
 * @module processor
 * @author ningmengchongshui
 */
import { isAsyncFunction } from 'util/types'
import { Next, Events, OnResponseValue, Current, EventKeys } from '../typings'
import { useState } from './hook-use-state'
import { showErrorModule } from './utils'
import { Response } from './store'
import { useSend } from './hook-use-api'

/**
 * 消息体处理机制
 * @param event
 * @param key
 */
export const expendEvent = async <T extends EventKeys>(
  valueEvent: Events[T],
  select: T,
  next: Function
) => {
  const res = new Response()
  const Send = useSend(valueEvent)

  // 得到所有 res
  const StoreResponse = res.value

  let valueI = 0

  /**
   * 下一步
   * @returns
   */
  const nextEvent: Next = (cn, ...cns) => {
    if (cn) {
      next(...cns)
      return
    }
    // 结束了
    if (valueI >= StoreResponse.length) {
      next()
      return
    }
    // 检查所有
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
        default: OnResponseValue<Current<EventKeys>, T>
        regular?: string | RegExp
      } = await import(`file://${file.path}`)

      if (!app?.default) {
        // 继续
        nextEvent()
        return
      }

      if (!app.default?.current) {
        // 继续
        nextEvent()
        return
      }

      // 检查状态
      if (file?.state) {
        const [state] = useState(file?.state)
        if (state == false) {
          // 继续
          nextEvent()
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
      }

      // 消息类型数据
      if (['message.create', 'private.message.create'].includes(select)) {
        if (app?.regular) {
          const reg = new RegExp(app.regular)
          if (!reg.test(valueEvent['MessageText'])) {
            // 继续
            nextEvent()
            return
          }
        }
      }

      if (Array.isArray(app.default.current)) {
        let i = 0
        let T = true
        let isNext = false

        const onRes = (res: any) => {
          if (isNext) {
            // 内部调用了next
            return
          }
          if (typeof res === 'boolean') {
            T = res
          } else if (Array.isArray(res)) {
            if (res.length > 0) {
              // 发送数据
              Send(...res)
            }
          } else if (typeof res === 'object') {
            if (typeof res?.allowGrouping === 'boolean') {
              T = res.allowGrouping
            }
            if (Array.isArray(res.data)) {
              // 发送数据
              Send(...res.data)
            }
          }
        }

        const start = async () => {
          if (i >= app.default.current.length) return
          // 不是真的
          if (!T) return
          if (isAsyncFunction(app.default.current[i])) {
            const res = await app.default.current[i](valueEvent, (...cns: boolean[]) => {
              isNext = true
              nextEvent(...cns)
            })
            onRes(res)
          } else {
            const res = app.default.current[i](valueEvent, (...cns: boolean[]) => {
              isNext = true
              nextEvent(...cns)
            })
            onRes(res)
          }
          ++i
          await start()
        }
        await start()
      } else {
        let isNext = false
        const onRes = (res: any) => {
          if (isNext) {
            // 内部调用了next
            return
          }
          if (typeof res === 'boolean') {
            // T = res
          } else if (Array.isArray(res)) {
            if (res.length > 0) {
              // 发送数据
              Send(...res)
            }
          } else if (typeof res === 'object') {
            if (typeof res?.allowGrouping === 'boolean') {
              // T = res.allowGrouping
            }
            if (Array.isArray(res.data)) {
              // 发送数据
              Send(...res.data)
            }
          }
        }
        // 这里是否继续时 next 说了算
        if (isAsyncFunction(app.default?.current)) {
          const res = await app.default?.current(valueEvent, (...cns: boolean[]) => {
            isNext = true
            nextEvent(...cns)
          })
          onRes(res)
        } else {
          const res = app.default?.current(valueEvent, (...cns: boolean[]) => {
            isNext = true
            nextEvent(...cns)
          })
          onRes(res)
        }
      }
    } catch (err) {
      showErrorModule(err)
    }
  }

  nextEvent()
}
