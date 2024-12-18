/**
 * @fileoverview 消息处理快
 * 登录模块向核心模块发送数据
 * 核心模块调用模块索引
 * @module processor
 * @author ningmengchongshui
 */
import { useParse } from '../hook/use-api'
import { AEvents } from '../env'
import { ResStore } from './store'
import { expendMiddleware } from './event-processor-mw'
import { isAsyncFunction } from 'util/types'

type EventMessageCreate = AEvents['message.create'] | AEvents['private.message.create']

/**
 * 消息体处理机制
 * @param event
 * @param key
 */
export const expendMessage = async <T extends keyof AEvents>(
  valueEvent: EventMessageCreate,
  select: T
) => {
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
      const obj = await import(`file://${file.path}`)
      const res = obj?.default
      const reg = res?.reg

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
        if (!ResStore[select].find(v => v.path === file.path)) {
          const valueKey = {
            dir: file?.dir,
            path: file.path,
            name: file.name,
            value: {
              reg: reg,
              select: res?.select ?? select
            }
          }
          // update files and values
          const index = global.AppsFiles.findIndex(v => v.path === file.path)
          global.AppsFiles.splice(index, 1)
          ResStore[select].push(valueKey)
        }
      }

      const msg = useParse(event, 'Text') ?? ''
      if (reg && !reg.test(msg)) {
        // 继续
        next()
        return
      }
      // 这里是否继续时 next 说了算
      if (isAsyncFunction(res?.current)) {
        res?.current(event, next)?.catch(logger.error)
      } else {
        res?.current(event, next)
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

    //
    const msg = useParse(event, 'Text') ?? ''

    try {
      if (!file.value) {
        const obj = await import(`file://${file.path}`)
        const res = obj?.default
        const reg = res?.reg
        if (reg && !reg.test(msg)) {
          next()
          return
        }
        // 这里是否继续时 next 说了算
        if (isAsyncFunction(res?.current)) {
          res?.current(event, next)?.catch(logger.error)
        } else {
          res?.current(event, next)
        }
      } else {
        // 在这里，存在了 value。使用value进行。不用读取文件
        const reg = file.value.reg
        if (reg && !reg.test(msg)) {
          next()
          return
        }
        const obj = await import(`file://${file.path}`)
        const res = obj?.default
        // 这里是否继续时 next 说了算
        if (isAsyncFunction(res?.current)) {
          res?.current(event, next)?.catch(logger.error)
        } else {
          res?.current(event, next)
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
