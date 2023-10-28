import { IOpenAPI } from 'qq-guild-bot'
import { not_permissions, permissions } from './types.js'
import { everyoneError } from '../../log/index.js'
declare global {
  var ClientQQ: IOpenAPI
}

/**
 * 得到权限对象
 * @param value 权值
 * @returns
 */
export function getPermissionsFromValue(value: number) {
  const look = Boolean(value & permissions.look)
  const manage = Boolean(value & permissions.manage)
  const speak = Boolean(value & permissions.speak)
  const broadcast = Boolean(value & permissions.broadcast)
  return { look, manage, speak, broadcast }
}

/**
 * 得到权限对象
 * @param channel_id  频道id
 * @param id  用户id
 * @returns
 */
export async function channewlPermissions(channel_id: any, id: any) {
  /* 自身机器人权限检测 */
  const authority: any = await ClientQQ.channelPermissionsApi
    .channelPermissions(channel_id, id)
    .catch(everyoneError)

  /* 机器人没有权限 */
  if (!authority) {
    return not_permissions
  }

  const {
    data: { permissions: botmiss }
  }: any = authority

  /** 错误的解构对象 */
  if (!botmiss) {
    return not_permissions
  }

  const power = getPermissionsFromValue(botmiss)

  return {
    state: true,
    ...power,
    botmiss
  }
}
