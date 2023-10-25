/**
 * 打印用户正常信息
 * @param channel_id
 * @param user_name
 * @param text
 */
export function AlemonJSLog(
  channel_id: string | number,
  user_name: string,
  text: any
) {
  console.info(`[${channel_id}] [${user_name}] [${true}] ${text}`)
}
/**
 * 打印用户错误信息
 * @param err
 * @param channel_id
 * @param user_name
 * @param text
 */
export function AlemonJSError(
  err: any,
  channel_id: string | number,
  user_name: string,
  text: any
) {
  console.info(`[${channel_id}] [${user_name}] [${false}] ${text}`)
  console.error(err)
}
