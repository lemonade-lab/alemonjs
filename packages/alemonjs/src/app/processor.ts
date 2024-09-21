import { useParse } from '../hook'
import { AEvents } from '../typing'
import { getFilesValues } from './files'

const values: {
  'message.create': {
    [key: string]: any
    dir: string
    path: string
  }[]
  'message.delete': {
    [key: string]: any
    dir: string
    path: string
  }[]
  'message.update': {
    [key: string]: any
    dir: string
    path: string
  }[]
} = {
  'message.create': [],
  'message.delete': [],
  'message.update': []
}

/**
 *
 * @param message
 */
const onMessageCreate = async (e: AEvents['message.create']) => {
  // 如何才能能正确消息调用。

  // 获取所有文件
  const files = getFilesValues()

  // 事件处理
  const next = () => {
    // i 结束了
    if (i >= files.length) {
      // j 结束了
      if (j >= filesMessageCreate.length) return
      // 开始调用j
      callj()
      return
    }
    calli()
  }

  let i = 0
  let j = 0

  const calli = async () => {
    // 调用完了
    if (i >= files.length) {
      // 开始调用j
      callj()
      return
    }
    i++
    const file = files[i]
    if (!file?.path) {
      // 继续
      calli()
      return
    }
    const obj = await import(`file://${file.path}`)
    const d = obj?.default
    console.log(obj)
    if (d?.event !== 'message.create') {
      // 继续
      calli()
      return
    }

    // 确保数据转移到 message.create存储位置
    // 确保下次直接流向 message.create ，不再从头开始

    const msg = useParse('Text', e.Megs) ?? ''
    if (d?.reg && !d?.reg.test(msg)) {
      // 继续
      calli()
      return
    }
    // 这里是否继续时 next 说了算
    d?.callback(e, { next, reg: d.reg })
  }

  // 这里必然都是 message.create
  const filesMessageCreate = values['message.create']

  const callj = async () => {
    // 调用完了
    if (j >= filesMessageCreate.length) {
      // 结束
      return
    }
    j++
    const file = filesMessageCreate[j]
    if (!file?.path) {
      callj()
      return
    }
    const obj = await import(`file://${file.path}`)
    const d = obj?.default
    console.log(obj)
    const msg = useParse('Text', e.Megs) ?? ''
    if (d?.reg && !d?.reg.test(msg)) {
      callj()
      return
    }
    // 这里是否继续时 next 说了算
    d?.callback(e, { next, reg: d.reg })
  }

  // 开始调用，调用完了i，再调用j
  calli()
}

/**
 * 消息处理器
 * @param value
 * @param event
 * @returns
 */
export const OnProcessor = <T extends keyof AEvents>(
  value: AEvents[T],
  event: T
) => {
  // 开始调用对应的存储
  if (event === 'message.create') {
    onMessageCreate(value as AEvents['message.create'])
  } else if (event === 'message.delete') {
    //
  } else if (event === 'message.update') {
    //
  }
  return
}
