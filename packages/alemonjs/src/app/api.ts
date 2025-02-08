import { DataEnums } from '../global'

/**
 * 向指定频道发送消息。
 * @param channel_id
 * @param data
 * @returns
 */
export const sendChannel = (channel_id: string, data: DataEnums[]) =>
  global.alemonjs.api.active.send.channel(channel_id, data)

/**
 * 向指定用户发送消息。
 * @param user_id
 * @param data
 * @returns
 */
export const sendUser = (user_id: string, data: DataEnums[]) =>
  global.alemonjs.api.active.send.user(user_id, data)
