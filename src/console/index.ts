import { green, red, yellow } from 'kolorist'
import dayjs from './day'

if (process.env.NODE_ENV !== 'production') {
  // 修改console.log
  const cl = console.log
  console.log = function (...args: any[]) {
    cl(green(`[ALMB] [${dayjs().format('YYYY-MM-DD HH:mm:ss')}] [${process.pid}] [INFO]`), ...args)
  }

  // 修改console.info
  const ci = console.info
  console.info = function (...args: any[]) {
    // 移除 心跳校验 和最大重试提示
    if (
      args[0] !== '[CLIENT] 心跳校验' &&
      args[0] !== '[CLIENT] 超过重试次数，连接终止' &&
      args[0] !== '[ERROR] createSession: '
    ) {
      ci(
        green(`[ALMB] [${dayjs().format('YYYY-MM-DD HH:mm:ss')}] [${process.pid}] [INFO]`),
        ...args
      )
    }
  }

  // 修改console.warn
  const cw = console.warn
  console.warn = function (...args: any[]) {
    cw(yellow(`[ALMB] [${dayjs().format('YYYY-MM-DD HH:mm:ss')}] [${process.pid}] [WARN]`), ...args)
  }

  // 修改console.error
  const ce = console.error
  console.error = function (...args: any[]) {
    const date = dayjs().format('YYYY-MM-DD HH:mm:ss')
    ce(red(`[ALMB] [${date}] [${process.pid}] [ERRO]`), ...args)
  }
} else {
  // 修改console.info
  const ci = console.info
  console.info = function (...args: any[]) {
    // 移除 心跳校验 和最大重试提示
    if (
      args[0] !== '[CLIENT] 心跳校验' &&
      args[0] !== '[CLIENT] 超过重试次数，连接终止' &&
      args[0] !== '[ERROR] createSession: '
    ) {
      ci(...args)
    }
  }
}
