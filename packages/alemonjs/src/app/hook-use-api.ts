import { DataEnums } from '../typing/message'
/**
 *
 * @param event
 * @returns
 */
export const useMention = (event: { [key: string]: any }) => global.alemonjs.api.use.mention(event)
/**
 * 发送消息
 */
export const useSend = (event: { [key: string]: any }) => {
  return (...val: DataEnums[]) => global.alemonjs.api.use.send(event, val)
}

/**
 * 卸载
 * 可读取自身pkg.main
 * @param mainDir
 */
export const unMount = (mainDir: string) => {
  const storeMainsIndex = global.storeMains.indexOf(mainDir)
  if (storeMainsIndex != -1) {
    global.storeMains.splice(storeMainsIndex, 1)
  }
  global.storeResponse = global.storeResponse.filter(item => item.source != mainDir)
  global.storeMiddleware = global.storeMiddleware.filter(item => item.source != mainDir)
  for (const key in global.storeResponseGather) {
    if (Array.isArray(global.storeResponseGather[key])) {
      global.storeResponseGather[key] = global.storeResponseGather[key].filter(
        item => item.source != mainDir
      )
    }
  }
  for (const key in global.storeMiddlewareGather) {
    if (Array.isArray(global.storeMiddlewareGather[key])) {
      global.storeMiddlewareGather[key] = global.storeMiddlewareGather[key].filter(
        item => item.source != mainDir
      )
    }
  }
}
