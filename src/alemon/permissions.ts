import { not_permissions, getPermissionsFromValue } from 'alemon'
/**
 * 得到权限对象
 * @param channel_id  频道id
 * @param id  用户id
 * @returns
 */
export async function channewlPermissions(channel_id: any, id: any) {
  /* 自身机器人权限检测 */
  const authority: any = await client.channelPermissionsApi
    .channelPermissions(channel_id, id)
    .catch((err: any) => console.error(err))

  /* 机器人没有权限 */
  if (!authority) {
    console.error(`[${channel_id}][${id}] 没有权限`)
    return not_permissions
  }

  const {
    data: { permissions: botmiss }
  }: any = authority

  /** 错误的解构对象 */
  if (!botmiss) {
    console.error(`[${channel_id}][${id}] 获取失败`)
    return not_permissions
  }

  const power = getPermissionsFromValue(botmiss)

  return {
    state: true,
    ...power,
    botmiss
  }
}
