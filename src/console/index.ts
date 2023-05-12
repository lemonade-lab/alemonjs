import { green, red, yellow } from 'kolorist'
import dayjs from './day'
if (process.env.NODE_ENV !== 'production') {
  const cl = console.log
  console.log = (...args: any[]) => {
    cl(green(`[ALMB] [${dayjs().format('YYYY-MM-DD HH:mm:ss')}] [${process.pid}] [INFO]`), ...args)
  }
  const ci = console.info
  console.info = (...args: any[]) => {
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
  const cw = console.warn
  console.warn = (...args: any[]) => {
    cw(yellow(`[ALMB] [${dayjs().format('YYYY-MM-DD HH:mm:ss')}] [${process.pid}] [WARN]`), ...args)
  }
  const ce = console.error
  console.error = (...args: any[]) => {
    const date = dayjs().format('YYYY-MM-DD HH:mm:ss')
    ce(red(`[ALMB] [${date}] [${process.pid}] [ERRO]`), ...args)
  }
} else {
  const ci = console.info
  console.info = (...args: any[]) => {
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
