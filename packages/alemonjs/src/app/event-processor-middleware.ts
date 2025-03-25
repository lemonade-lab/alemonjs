/**
 * @fileoverview 消息处理快
 * 登录模块向核心模块发送数据
 * 核心模块调用模块索引
 * @module processor
 * @author ningmengchongshui
 */
import { isAsyncFunction } from 'util/types'
import { Next, Events, OnMiddlewareValue, Current, EventKeys } from '../typings'
import { useState } from './hook-use-state'
import { showErrorModule } from './utils'
import { Middleware } from './store'
import { useSend } from './hook-use-api'

/**
 * 处理中间件
 * @param event
 * @param select
 */
export const expendMiddleware = async <T extends EventKeys>(
  valueEvent: Events[T],
  select: T,
  next: Function
) => {
  const mw = new Middleware()
  const Send = useSend(valueEvent)
  // 得到所有 mws
  const mwFiles = mw.value

  let valueI = 0
  // let valueJ = 0

  /**
   * 下一步
   * @returns
   */
  const nextMiddleware: Next = async (cn, ...cns) => {
    if (cn) {
      next(...cns)
      return
    }
    // 结束了
    if (valueI >= mwFiles.length) {
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
    if (valueI >= mwFiles.length) {
      // 开始调用j
      nextMiddleware()
      return
    }
    valueI++
    const file = mwFiles[valueI - 1]
    if (!file?.path) {
      // 继续
      nextMiddleware()
      return
    }

    try {
      const app: {
        default: OnMiddlewareValue<Current<EventKeys>, T>
        regular?: string | RegExp
        // name?: string
        // state?: [boolean, (value: boolean) => void]
      } = await import(`file://${file.path}`)

      if (!app?.default) {
        // 继续
        nextMiddleware()
        return
      }

      if (!app.default.current) {
        // 继续
        nextMiddleware()
        return
      }

      // 检查状态
      if (file?.stateKey) {
        const [state] = useState(file?.stateKey)
        if (state == false) {
          // 继续
          nextMiddleware()
          return
        }
      }

      if (['message.create', 'private.message.create'].includes(select)) {
        if (app?.regular) {
          const reg = new RegExp(app.regular)
          if (!reg.test(valueEvent['MessageText'])) {
            // 继续
            nextMiddleware()
            return
          }
        }
      }

      // 是数组
      if (Array.isArray(app.default?.select)) {
        // 不包含
        if (!app.default?.select.includes(select)) {
          // 继续
          nextMiddleware()
          return
        }
        // 不是数组
      } else {
        // 不匹配
        if (app.default?.select !== select) {
          // 继续
          nextMiddleware()
          return
        }
      }

      if (Array.isArray(app.default.current)) {
        let i = 0
        let T = true
        let isNext = false
        /**
         *
         * @param res
         * @returns
         */
        const onRes = (res: any) => {
          if (isNext) {
            // 被调用了next
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
              nextMiddleware(...cns)
            })
            onRes(res)
          } else {
            const res = app.default.current[i](valueEvent, (...cns: boolean[]) => {
              isNext = true
              nextMiddleware(...cns)
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
            // 被调用了next
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
          const res = await app.default?.current(valueEvent, (...cns) => {
            isNext = true
            nextMiddleware(...cns)
          })
          onRes(res)
        } else {
          const res = app.default?.current(valueEvent, (...cns) => {
            isNext = true
            nextMiddleware(...cns)
          })
          onRes(res)
        }
      }
    } catch (err) {
      showErrorModule(err)
    }
  }

  // 开始修正模式
  nextMiddleware()
}
