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
