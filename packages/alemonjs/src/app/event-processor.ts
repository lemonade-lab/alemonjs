import { join } from 'node:path'
import fs from 'node:fs'
import { useParse } from '../hook/use-api'
import { AEvents } from '../env'

type DbKey = {
  // 目录
  dir: string
  value?: {
    // 正则
    reg: RegExp
    // 事件
    event: string
    // 优先级
    priority: number
  } | null
  // 文件路径
  path: string
}

declare global {
  var AppsFiles: DbKey[]
}

if (!global.AppsFiles) {
  global.AppsFiles = []
}

//
const values: {
  'message.create': DbKey[]
  'private.message.create': DbKey[]
} = {
  'message.create': [],
  'private.message.create': []
}

/**
 * 递归获取所有文件名以 res 开头的文件
 * @param dir 目录路径
 * @returns 文件路径数组
 */
const getAppsFiles = (dir: string): string[] => {
  let results: string[] = []
  const list = fs.readdirSync(dir, { withFileTypes: true })
  list.forEach(item => {
    const fullPath = join(dir, item.name)
    if (item.isDirectory()) {
      results = results.concat(getAppsFiles(fullPath))
    } else if (item.isFile() && item.name.startsWith('res')) {
      if (
        item.name.endsWith('.ts') ||
        item.name.endsWith('.js') ||
        item.name.endsWith('.jsx') ||
        item.name.endsWith('.tsx')
      ) {
        results.push(fullPath)
      }
    }
  })
  return results
}

/**
 *
 * @param val
 */
export const pushAppsFiles = (val: DbKey) => {
  global.AppsFiles.push(val)
}

/**
 *
 * @param e
 * @param key
 */
const onMessage = <T extends keyof AEvents>(
  e: AEvents['message.create'] | AEvents['private.message.create'],
  key: T
) => {
  // 如果不存在。则创建
  if (!global.storeoberver) global.storeoberver = {}
  //
  if (!global.storeoberver[key]) {
    global.storeoberver[key] = []
  }
  // copy
  const messageFiles = [...global.AppsFiles]
  const messageCreate = [...values[key]]

  let i = 0
  let j = 0
  let n = 0

  // 事件处理
  const next = () => {
    // i 结束了
    if (i >= messageFiles.length) {
      // j 结束了
      if (j >= messageCreate.length) {
        return
      }
      // 开始调用j
      callj()
      return
    }
    calli()
  }

  //
  const nextOberver = () => {
    // i 结束了
    if (n >= global.storeoberver[key].length) {
      // 开始调用i
      next()
      return
    }

    //
    n++

    // 发现订阅
    const item = global.storeoberver[key][n - 1]
    if (!item) {
      // 继续 next
      nextOberver()
      return
    }

    for (const key in item.event) {
      // 只要发现不符合的，就继续
      if (item.event[key] !== e[key]) {
        // 不符合。继续 next。
        nextOberver()
        return
      }
    }

    // 设置为undefined
    global.storeoberver[key][n - 1] = undefined

    // 放回来
    const Continue = () => {
      global.storeoberver[key][n - 1] = item
      // 直接结束才对
    }

    // 没有调用下一步。应该删除当前的 n ？

    // 有没有可能。按key来分。

    item.callback(e, { next: Continue })

    //
  }

  const calli = async () => {
    // 调用完了
    if (i >= messageFiles.length) {
      // 开始调用j
      next()
      return
    }
    i++
    const file = messageFiles[i - 1]
    if (!file?.path) {
      // 继续
      next()
      return
    }
    const obj = await import(`file://${file.path}`)
    const d = obj?.default

    if (d?.event !== key) {
      // 继续
      next()
      return
    }

    const v = {
      dir: file?.dir,
      path: file.path,
      value: {
        reg: d?.reg,
        event: d?.event ?? key,
        priority: d?.priority ?? 0
      }
    }

    // 推送, 确保下次直接流向 key ，不再从头开始
    if (!values[key].find(v => v.path === file.path)) {
      // update files and values
      const index = global.AppsFiles.findIndex(v => v.path === file.path)
      global.AppsFiles.splice(index, 1)
      values[key].push(v)
    }

    const msg = useParse(e.Megs, 'Text') ?? ''
    if (d?.reg && !d?.reg.test(msg)) {
      // 继续
      next()
      return
    }
    // 这里是否继续时 next 说了算
    d?.callback(e, { next, reg: d.reg })
  }

  const callj = async () => {
    // 调用完了
    if (j >= messageCreate.length) {
      return
    }
    j++
    const file = messageCreate[j - 1]
    if (!file?.path) {
      next()
      return
    }

    //
    const msg = useParse(e.Megs, 'Text') ?? ''

    if (!file.value) {
      const obj = await import(`file://${file.path}`)
      const d = obj?.default
      const reg = d?.reg
      if (reg && !reg.test(msg)) {
        next()
        return
      }
      // 这里是否继续时 next 说了算
      d?.callback(e, { next, reg: reg })
    } else {
      // 在这里，存在了 value。使用value进行。不用读取文件
      const reg = file.value.reg
      if (reg && !reg.test(msg)) {
        next()
        return
      }
      const obj = await import(`file://${file.path}`)
      const d = obj?.default
      d?.callback(e, { next, reg: reg })
    }

    //
  }

  // 开始调用i
  nextOberver()
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
