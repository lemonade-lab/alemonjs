/**
 * @fileoverview 消息处理快
 * 登录模块向核心模块发送数据
 * 核心模块调用模块索引
 * @module processor
 * @author ningmengchongshui
 */
import { isAsyncFunction } from 'util/types'
import { Next, Events, OnMiddlewareValue, Current } from '../typings'
import { useState } from './hook-use-state'
import { showErrorModule } from './utils'
import { Middleware, MiddlewareGather } from './store'
import { useSend } from './hook-use-api'

/**
 * 处理中间件
 * @param event
 * @param select
 */
export const expendMiddleware = async <T extends keyof Events>(
  valueEvent: Events[T],
  select: T,
  next: Function
) => {
  const mw = new Middleware()
  const mwGather = new MiddlewareGather(select)
  const Send = useSend(valueEvent)
  // 得到所有 apps
  const mwFiles = mw.value
  // 得到对应类型的消息
  const mws = mwGather.value

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
        default: OnMiddlewareValue<Current<keyof Events>, T>
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
      if (file?.state) {
        const [state] = useState(file?.state)
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
        if (!mwGather.value.find(v => v.path === file.path)) {
          // 索引
          const index = mw.value.findIndex(v => v.path === file.path)
          // 去除
          mw.value.splice(index, 1)
          // 存储
          mwGather.value.push({
            source: file.source,
            dir: file.dir,
            path: file.path,
            name: file.name,
            node: file.node,
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
            const res = await app.default.current[i](valueEvent, nextMiddleware)
            if (typeof res === 'boolean') {
              T = res
            } else if (Array.isArray(res) && res.length > 0) {
              // 发送数据
              await Send(...res)
            } else if (typeof res === 'object') {
              if (typeof res.allowGrouping === 'boolean') {
                T = res.allowGrouping
              }
              if (Array.isArray(res.data)) {
                // 发送数据
                await Send(...res)
              }
            }
          } else {
            const res = await app.default.current[i](valueEvent, nextMiddleware)
            if (typeof res === 'boolean') {
              T = res
            } else if (Array.isArray(res) && res.length > 0) {
              // 发送数据
              await Send(...res)
            } else if (typeof res === 'object') {
              if (typeof res.allowGrouping === 'boolean') {
                T = res.allowGrouping
              }
              if (Array.isArray(res.data)) {
                // 发送数据
                await Send(...res)
              }
            }
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
      showErrorModule(err)
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
        default: OnMiddlewareValue<Current<keyof Events>, T>
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

      if (file?.state) {
        const [state] = useState(file?.state)
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
            const res = await app.default.current[i](valueEvent, nextMiddleware)
            if (typeof res === 'boolean') {
              T = res
            } else if (Array.isArray(res) && res.length > 0) {
              // 发送数据
              await Send(...res)
            } else if (typeof res === 'object') {
              if (typeof res.allowGrouping === 'boolean') {
                T = res.allowGrouping
              }
              if (Array.isArray(res.data)) {
                // 发送数据
                await Send(...res)
              }
            }
          } else {
            const res = await app.default.current[i](valueEvent, nextMiddleware)
            if (typeof res === 'boolean') {
              T = res
            } else if (Array.isArray(res) && res.length > 0) {
              // 发送数据
              await Send(...res)
            } else if (typeof res === 'object') {
              if (typeof res.allowGrouping === 'boolean') {
                T = res.allowGrouping
              }
              if (Array.isArray(res.data)) {
                // 发送数据
                await Send(...res)
              }
            }
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
      showErrorModule(err)
    }
    //
  }

  // 开始修正模式
  await nextMiddleware()
}
