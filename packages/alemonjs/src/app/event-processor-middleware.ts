/**
 * @fileoverview 消息处理快
 * 登录模块向核心模块发送数据
 * 核心模块调用模块索引
 * @module processor
 * @author ningmengchongshui
 */
import { isAsyncFunction } from 'util/types'
import { Events } from '../typing/event/map'
import { OnMiddlewareValue } from '../typing/event'
import { Next } from '../global'
import { useState } from './hook-use-state'
import { ErrorModule } from './utils'

/**
 * @param event
 * @param select
 */
export const expendMiddleware = async <T extends keyof Events>(
  valueEvent: Events[T],
  select: T,
  next: Function
) => {
  // 得到所有 apps
  const mwFiles = [...global.storeMiddleware]
  // 得到对应类型的消息
  const mws = [...global.storeMiddlewareGather[select]]

  let valueI = 0
  let valueJ = 0

  /**
   * 下一步
   * @returns
   */
  const nextMiddleware: Next = async (cn, ...cns) => {
    if (cn) {
      next(...cns)
      return
    }
    // i 结束了
    if (valueI >= mwFiles.length) {
      // j 结束了
      if (valueJ >= mws.length) {
        next()
        return
      }
      // 走 j，检查所有分毫类型的
      await callj()
      return
    }
    // 走 i，检查所有 apps
    await calli()
  }

  /**
   * 执行 i
   * @returns
   */
  const calli = async () => {
    // 调用完了
    if (valueI >= mwFiles.length) {
      // 开始调用j
      await nextMiddleware()
      return
    }
    valueI++
    const file = mwFiles[valueI - 1]
    if (!file?.path) {
      // 继续
      await nextMiddleware()
      return
    }

    try {
      const app: {
        default: OnMiddlewareValue<any, T>
        name?: string
        state?: [boolean, (value: boolean) => void]
      } = await import(`file://${file.path}`)

      if (!app?.default) {
        // 继续
        await nextMiddleware()
        return
      }

      if (!app.default.current) {
        // 继续
        await nextMiddleware()
        return
      }

      // 检查状态
      if (app?.name) {
        const [state] = useState(app?.name)
        if (state == false) {
          // 继续
          await nextMiddleware()
          return
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
        // 不是数组，进行分类存储
        // 判断是否已经存储
        if (!storeMiddlewareGather[select].find(v => v.path === file.path)) {
          // 索引
          const index = global.storeMiddleware.findIndex(v => v.path === file.path)
          // 去除
          global.storeMiddleware.splice(index, 1)
          // 存储
          storeMiddlewareGather[select].push({
            source: file.source,
            dir: file.dir,
            path: file.path,
            name: file.name,
            value: {
              select: app.default?.select ?? select
            }
          })
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
            T = await app.default.current[i](valueEvent, nextMiddleware)
          } else {
            T = await app.default.current[i](valueEvent, nextMiddleware)
          }
          ++i
          await start()
        }
        await start()
      } else {
        // 这里是否继续时 next 说了算
        if (isAsyncFunction(app.default?.current)) {
          app.default?.current(valueEvent, nextMiddleware)
        } else {
          app.default?.current(valueEvent, nextMiddleware)
        }
      }
    } catch (err) {
      ErrorModule(err)
    }
  }

  /**
   * 被分类好的
   * @returns
   */
  const callj = async () => {
    // 调用完了
    if (valueJ >= mws.length) {
      return
    }
    valueJ++
    const file = mws[valueJ - 1]
    if (!file?.path) {
      await nextMiddleware()
      return
    }
    try {
      const app: {
        default: OnMiddlewareValue<any, T>
        name?: string
        state?: [boolean, (value: boolean) => void]
      } = await import(`file://${file.path}`)

      if (!app?.default) {
        // 继续
        await nextMiddleware()
        return
      }

      if (!app.default.current) {
        // 继续
        await nextMiddleware()
        return
      }

      if (app?.name) {
        const [state] = useState(app?.name)
        if (state == false) {
          // 继续
          await nextMiddleware()
          return
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
            T = await app.default.current[i](valueEvent, nextMiddleware)
          } else {
            T = await app.default.current[i](valueEvent, nextMiddleware)
          }
          ++i
          await start()
        }
        await start()
      } else {
        // 这里是否继续时 next 说了算
        if (isAsyncFunction(app.default?.current)) {
          app.default?.current(valueEvent, nextMiddleware)
        } else {
          app.default?.current(valueEvent, nextMiddleware)
        }
      }
    } catch (err) {
      ErrorModule(err)
    }
    //
  }

  // 开始修正模式
  await nextMiddleware()
}
