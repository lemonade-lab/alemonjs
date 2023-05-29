import { not_permissions, getPermissionsFromValue } from 'alemon'
/**
 * 可查看子频道	0x0000000001(1 << 0)	支持指定成员可见类型，支持身份组可见类型
 * 可管理子频道	0x0000000002(1 << 1)	创建者、管理员、子频道管理员都具有此权限
 * 可发言子频道	0x0000000004(1 << 2)	支持指定成员发言类型，支持身份组发言类型
 * 可直播子频道	0x0000000008 (1 << 3)	支持指定成员发起直播，支持身份组发起直播；仅可在直播子频道中设置
 */
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
