// 这里创建存储
import { AEvents } from '../typing'
import { getFilesValues } from './files'

/**
 *
 * @param message
 */
const onMessageCreate = async e => {
  const files = getFilesValues()

  // 事件处理
  const next = () => {
    //
  }

  // 关闭
  const close = () => {
    //
  }

  for (const file of files) {
    // 读取文件
    const obj = await import(`file://${file.path}`)
    // 执行文件
    obj.default(e, { next, close, reg: file.reg })
    //
  }
}

/**
 * 按event去存储file
 */

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
    onMessageCreate(value)
  }

  return
}
