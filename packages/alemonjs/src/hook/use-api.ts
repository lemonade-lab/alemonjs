import { readFileSync } from 'fs'
import { DataEnums, DataParseType, ParseType } from './message-typing'

export * from './message-format'

/**
 * 全局声明
 */
declare global {
  var alemonjs: {
    api: {
      use: {
        send: (event: { [key: string]: any }, val: any[]) => void
      }
    }
  }
}

/**
 * 解析返回指定类型
 * @param event 事件类型
 * @param value 值数组
 * @returns 解析后的值
 */
export const useParse = <T extends keyof DataParseType>(
  value: DataParseType[T][] = [],
  event: T
): ParseType[T] | undefined => {
  const msgs = value.filter(item => item.type === event)
  if (msgs.length === 0) return undefined
  switch (event) {
    case 'Text': {
      return (msgs as DataParseType['Text'][]).map(item => item.value).join('')
    }
    case 'Image': {
      const d: Buffer[] = []
      for (const item of msgs as DataParseType['Image'][]) {
        if (item.typing === 'buffer') {
          d.push(item.value as Buffer)
        }
        // 如果是url。或者是本地文件
        if (item.typing === 'file') {
          const m = readFileSync(item.value, 'utf-8')
          d.push(Buffer.from(readFileSync(m)))
        }
      }
      return d.length > 0 ? d : undefined
    }
    case 'At': {
      return (msgs as DataParseType['Text'][]).map(item => {
        return {
          value: item.value,
          typing: item.typing
        }
      })
    }
    default:
      return undefined
  }
}

/**
 * 发送消息
 */
export const useSend = (event: { [key: string]: any }) => {
  return (...val: DataEnums[]) => global.alemonjs.api.use.send(event, val)
}
