export * from './user.js'
export * from './event.js'
export const everyoneError = (err: any) => {
  console.error(err)
  return err
}
/**
 * 捕捉插件错误
 * @param appname
 * @param err
 * @returns
 */
export const AppNameError = (appname: string, err: any) => {
  // 属于依赖缺失
  const match = /Cannot find package '(.+)' imported from/.exec(err.message)
  if (match && match[1]) {
    const packageName = match[1]
    console.error(`[APP] [${appname}] 缺失 ${packageName} 包`)
    // 发送消息
    process.send?.({
      type: 'lack-of-package',
      message: {
        packageName
      }
    })
    return
  } else {
    // 其他错误
    console.error(`[APP] [${appname}]`, err)
    process.send?.({
      type: 'error',
      message: err
    })
  }
}
