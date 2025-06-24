/**
 * @fileoverview 消息处理快
 * 登录模块向核心模块发送数据
 * 核心模块调用模块索引
 * @module processor
 * @author ningmengchongshui
 */
import { isAsyncFunction } from 'util/types'
import { Next, Events, OnMiddlewareValue, Current, EventKeys, CurrentResultValue } from '../typings'
import { useState } from './hook-use-state'
import { showErrorModule } from '../core/utils'
import { Middleware } from './store'
import { useMessage } from './hook-use-api'
import { EventMessageText } from '../core/variable'

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
  const [message] = useMessage(valueEvent)
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

      if (!app?.default || !app?.default?.current || !app?.default?.select) {
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

      if (EventMessageText.includes(select)) {
        if (app?.regular) {
          const reg = new RegExp(app.regular)
          if (!reg.test(valueEvent['MessageText'])) {
            // 继续
            nextMiddleware()
            return
          }
        }
      }

      const selects = Array.isArray(app.default.select) ? app.default.select : [app.default.select]

      if (!selects.includes(select)) {
        // 继续
        nextMiddleware()
        return
      }

      const currents = Array.isArray(app.default.current)
        ? app.default.current
        : [app.default.current]

      let index = 0
      let isClose = false
      let isNext = false
      /**
       *
       * @param res
       * @returns
       */
      const onRes = (res: CurrentResultValue) => {
        if (!res) {
          isClose = true
        } else if (Array.isArray(res)) {
          if (res.length > 0) {
            // 发送数据
            message.send(res)
          }
          isClose = true
        } else if (typeof res === 'object') {
          if (Array.isArray(res.data)) {
            // 发送数据
            message.send(res.data)
          }
          if (!res.allowGrouping) {
            isClose = true
          }
        }
      }
      const start = async () => {
        if (index >= currents.length) return
        if (isNext) return
        if (isClose) return
        if (isAsyncFunction(currents[index])) {
          const res = await currents[index](valueEvent, (...cns: boolean[]) => {
            isNext = true
            nextMiddleware(...cns)
          })
          onRes(res)
        } else {
          const res = currents[index](valueEvent, (...cns: boolean[]) => {
            isNext = true
            nextMiddleware(...cns)
          })
          onRes(res)
        }
        ++index
        start()
      }
      start()
    } catch (err) {
      showErrorModule(err)
    }
  }

  // 开始修正模式
  nextMiddleware()
}
