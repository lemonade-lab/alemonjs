/**
 * 打印用户正常信息
 * @param channel_id
 * @param user_name
 * @param text
 */
export function AlemonJSEventLog(event: string | number, eventType: string) {
  console.info('[AlemonJS]', `[${event}] [${eventType}] [${true}]`)
}
/**
 * 打印用户错误信息
 * @param err
 * @param channel_id
 * @param user_name
 * @param text
 */
export function AlemonJSEventError(
  err: any,
  event: string | number,
  eventType: string
) {
  console.info('[AlemonJS]', `[${event}] [${eventType}] [${false}]`)
  console.error(err)
}
