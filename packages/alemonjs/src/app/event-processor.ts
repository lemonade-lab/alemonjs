/**
 * @fileoverview 消息处理快
 * 登录模块向核心模块发送数据
 * 核心模块调用模块索引
 * @module processor
 * @author ningmengchongshui
 */
import { useParse } from '../hook/use-api'
import { AEvents } from '../env'

type DbKey = {
  // 目录
  dir: string
  // 文件路径
  path: string
  // 文件名
  name: string
  //
  value?: {
    // 正则
    reg: RegExp
    // 事件
    event: string
    // 优先级
    priority: number
  } | null
}

type MWKey = {
  // 目录
  dir: string
  // 文件路径
  path: string
  // 文件名
  name: string
  //
  value?: {
    // 事件
    event: string
  } | null
}

declare global {
  var AppsFiles: DbKey[]
  var MWFiles: MWKey[]
}

if (!global.AppsFiles) {
  global.AppsFiles = []
}

if (!global.MWFiles) {
  global.MWFiles = []
}

//
const resStore: {
  'message.create': DbKey[]
  'private.message.create': DbKey[]
} = {
  'message.create': [],
  'private.message.create': []
}

// 中间件
const mwStore: {
  'message.create': MWKey[]
  'private.message.create': MWKey[]
} = {
  'message.create': [],
  'private.message.create': []
}

/**
 *
 * @param val
 */
export const pushAppsFiles = (val: DbKey) => {
  global.AppsFiles.push(val)
}

export const pushMWFiles = (val: MWKey) => {
  global.MWFiles.push(val)
}

/**
 *
 * @param event
 * @param key
 */
const onMiddleware = async <T extends keyof AEvents>(
  event: AEvents['message.create'] | AEvents['private.message.create'],
  key: T
) => {
  // 得到所有 apps
  const mwFiles = [...global.MWFiles]
  // 得到对应类型的消息
  const mws = [...mwStore[key]]

  let valueI = 0
  let valueJ = 0

  /**
   * 下一步
   * @returns
   */
  const next = async () => {
    // i 结束了
    if (valueI >= mwFiles.length) {
      // j 结束了
      if (valueJ >= mws.length) {
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
      await next()
      return
    }
    valueI++
    const file = mwFiles[valueI - 1]
    if (!file?.path) {
      // 继续
      await next()
      return
    }

    try {
      const obj = await import(`file://${file.path}`)
      const res = obj?.default
      if (res?.event !== key) {
        // 继续
        await next()
        return
      }
      const valueKey = {
        dir: file?.dir,
        path: file.path,
        name: file.name,
        value: {
          event: res?.event ?? key
        }
      }
      // 推送, 确保下次直接流向 key ，不再从头开始
      if (!mwStore[key].find(v => v.path === file.path)) {
        // update files and values
        const index = global.MWFiles.findIndex(v => v.path === file.path)
        global.MWFiles.splice(index, 1)
        mwStore[key].push(valueKey)
      }
      // 这里是否继续时 next 说了算
      event = await res?.callback(event, { next, reg: res.reg })
    } catch (err) {
      // 不再继续
      logger.error(err)
    }
  }

  const callj = async () => {
    // 调用完了
    if (valueJ >= mws.length) {
      return
    }
    valueJ++
    const file = mws[valueJ - 1]
    if (!file?.path) {
      await next()
      return
    }
    try {
      if (!file.value) {
        const obj = await import(`file://${file.path}`)
        const res = obj?.default
        // 这里是否继续时 next 说了算
        event = await res?.callback(event, { next })
      } else {
        const obj = await import(`file://${file.path}`)
        const res = obj?.default
        // 这里是否继续时 next 说了算
        event = res?.callback(event, { next })
      }
    } catch (err) {
      logger.error(err)
    }
    //
  }

  // 开始修正模式
  await next()

  return event
}

/**
 *
 * @param event
 * @param key
 */
const onMessage = async <T extends keyof AEvents>(
  valueEvent: AEvents['message.create'] | AEvents['private.message.create'],
  key: T
) => {
  // 如果不存在。则创建 storeoberver
  if (!global.storeoberver) global.storeoberver = {}
  // 如果不存在。则创建 storeoberver[key]
  if (!global.storeoberver[key]) global.storeoberver[key] = []
  // 得到所有 apps
  const messageFiles = [...global.AppsFiles]
  // 得到对应类型的消息
  const messages = [...resStore[key]]

  let valueI = 0
  let valueJ = 0
  let valueN = 0

  // 使用中间件修正 event
  const event = await onMiddleware(valueEvent, key)

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
    if (valueN >= global.storeoberver[key].length) {
      // 订阅都检查过一遍。开始 next
      next()
      return
    }
    //
    valueN++
    // 发现订阅
    const item = global.storeoberver[key][valueN - 1]
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
    global.storeoberver[key][valueN - 1] = undefined
    // 放回来
    const Continue = () => {
      global.storeoberver[key][valueN - 1] = item
      // 直接结束才对
    }
    // 没有调用下一步。应该删除当前的 n ？
    // 有没有可能。按key来分。
    item.callback(event, { next: Continue })
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
      if (res?.event !== key) {
        // 继续
        next()
        return
      }
      const valueKey = {
        dir: file?.dir,
        path: file.path,
        name: file.name,
        value: {
          reg: res?.reg,
          event: res?.event ?? key,
          priority: res?.priority ?? 0
        }
      }
      // 推送, 确保下次直接流向 key ，不再从头开始
      if (!resStore[key].find(v => v.path === file.path)) {
        // update files and values
        const index = global.AppsFiles.findIndex(v => v.path === file.path)
        global.AppsFiles.splice(index, 1)
        resStore[key].push(valueKey)
      }
      const msg = useParse(event.Megs, 'Text') ?? ''
      if (res?.reg && !res?.reg.test(msg)) {
        // 继续
        next()
        return
      }
      // 这里是否继续时 next 说了算
      res?.callback(event, { next, reg: res.reg })
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
    const msg = useParse(event.Megs, 'Text') ?? ''

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
        res?.callback(event, { next, reg: reg })
      } else {
        // 在这里，存在了 value。使用value进行。不用读取文件
        const reg = file.value.reg
        if (reg && !reg.test(msg)) {
          next()
          return
        }
        const obj = await import(`file://${file.path}`)
        const res = obj?.default
        res?.callback(event, { next, reg: reg })
      }
    } catch (err) {
      logger.error(err)
    }
    //
  }

  // 先从观察者开始
  nextObserver()
}

/**
 * 消息处理器
 * @param value
 * @param event
 * @returns
 */
export const OnProcessor = <T extends keyof AEvents>(value: AEvents[T], event: T) => {
  switch (event) {
    case 'message.create':
      onMessage(value as AEvents['message.create'], 'message.create')
      break
    case 'private.message.create':
      onMessage(value as AEvents['private.message.create'], 'private.message.create')
      break
    default:
      break
  }
  return
}
