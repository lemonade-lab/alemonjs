import axios from 'axios'
import { getClientConfig } from './config.js'
import {
  ApiEnum,
  type MHYEnum,
  type MemberDataType,
  type MemberType,
  type VillaType,
  type MemberListType,
  type BotReplyMessageType,
  type Group,
  type GroupRoom,
  type RoomMsg,
  type ColorEnum,
  type MemberRolePermissionEnum,
  type Emoticon,
  type MemberRoleList,
  type UrlType
} from './types.js'

/**
 * 别野服务
 * @param villa_id 别野编号
 * @param config 配置
 * @returns
 */
export async function villaService(villa_id: number, config: object) {
  const ClientCfg = getClientConfig()
  const service = axios.create({
    baseURL: 'https://bbs-api.miyoushe.com', // 地址
    timeout: 30000, // 响应
    headers: {
      'x-rpc-bot_id': ClientCfg.bot_id, // 账号
      'x-rpc-bot_secret': ClientCfg.bot_secret, // 密码
      'x-rpc-bot_villa_id': villa_id // 别墅编号
    }
  })
  return await service(config)
}

/**
 * 图片转存
 * @param villa_id
 * @param url
 * @returns
 * type = villa
 */
export async function transferImage(
  villa_id: number,
  url: string
): Promise<{
  data: UrlType
}> {
  return await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.transferImage,
    data: {
      url
    }
  }).then(res => res.data)
}

/**
 * ******
 * 鉴权api
 * ******
 */
/**
 * 校验用户机器人访问凭证
 * @param villa_id 别野
 * @param token 令牌
 * @returns
 * type = villa
 */
export async function checkMemberBotAccessToken(
  villa_id: number,
  token: string
): Promise<{
  data: MemberDataType
}> {
  return await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.checkMemberBotAccessToken,
    data: {
      token
    }
  }).then(res => res.data)
}
/**
 * ******
 * 大别野api
 * ******
 */

/**
 * 获取大别野信息
 * @param villa_id  别野编号
 * @returns
 * type = villa
 */
export async function getVilla(villa_id: number): Promise<{
  data: {
    villa: VillaType
  }
}> {
  return await villaService(villa_id, {
    method: 'get',
    url: ApiEnum.getVilla
  }).then(res => res.data)
}

/**
 * 已测
 * 获取大别野成员列表
 * @param villa_id  别野编号
 * @param offset_str  起始位置偏移量
 * @param size 分页大小
 * @returns
 * type = villa_id
 */
export async function getVillaMembers(
  villa_id: number,
  offset_str: string,
  size: number
): Promise<{
  data: {
    list: MemberListType
  }
}> {
  return await villaService(villa_id, {
    method: 'get',
    url: ApiEnum.getVillaMembers,
    params: {
      offset_str,
      size
    }
  }).then(res => res.data)
}

/**
 * ******
 * 用户api
 * ******
 */
/**
 * 已测
 * 获取用户信息
 * @param villa_id 别野
 * @param uid 用户编号
 * @returns
 * type = user
 */
export async function getMember(
  villa_id: number,
  uid: string
): Promise<{
  data: {
    member: MemberType
  }
}> {
  return await villaService(villa_id, {
    method: 'get',
    url: ApiEnum.getMember,
    params: {
      uid
    }
  }).then(res => res.data)
}

/**
 * ??
 * 踢出大别野用户
 * @param villa_id 别野编号
 * @param uid 用户编号
 * @returns
 * type = user
 */
export async function deleteVillaMember(villa_id: number, uid: string) {
  return await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.deleteVillaMember,
    data: {
      uid
    }
  }).then(res => res.data)
}
/**
 * *******
 * 消息api
 * *******
 */
/**
 * ??
 * 置顶消息
 * @param villa_id 别野编号
 * @param data 配置数据
 * @returns
 * type = message
 */
export async function pinMessage(
  villa_id: number,
  data: {
    msg_uid: string // 消息 id
    is_cancel: boolean // 是否取消置顶
    room_id: string // 房间 id
    send_at: number // 发送时间
  }
) {
  return await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.pinMessage,
    data
  }).then(res => res.data)
}
/**
 * tudo 官网文档 为 get  实际为  post
 * 撤回消息
 * @param villa_id 别野编号
 * @param data 配置数据
 * @returns
 * type = message
 */
export async function recallMessage(
  villa_id: number,
  data: {
    msg_uid: string // 消息 id
    room_id: string // 房间 id
    msg_time: number // 发送时间
  }
) {
  return await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.recallMessage,
    data
  }).then(res => res.data)
}

/**
 * 已测
 * 发送消息
 * @param villa_id 别野编号
 * @param data 配置数据
 * @returns
 * type = room_id
 */
export async function sendMessage(
  villa_id: number,
  data: {
    room_id: number
    object_name: (typeof MHYEnum)[number]
    msg_content: string
  }
): Promise<{
  data: BotReplyMessageType
}> {
  return await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.sendMessage,
    data
  }).then(res => res.data)
}

/**
 * ******
 * 房间api
 * ******
 */

/**
 * 已测
 * 创建分组
 * @param villa_id 别野编号
 * @param group_name 分组名
 * @returns
 * type = group_id
 */
export async function createGroup(
  villa_id: number,
  group_name: string
): Promise<{
  data: {
    group_id: string
  }
}> {
  return await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.createGroup,
    data: { group_name }
  }).then(res => res.data)
}

/**
 * ？？
 * 编辑分组
 * @param villa_id 别野编号
 * @param group_id 分组编号
 * @param group_name 分组名称
 * @returns
 * type = group_id
 */
export async function editGroup(
  villa_id: number,
  group_id: number,
  group_name: string
) {
  return await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.editGroup,
    data: { group_id, group_name }
  }).then(res => res.data)
}
/**
 * ？？
 * 删除分组
 * @param villa_id 别野编号
 * @param group_id 分组编号
 * @returns
 * type = group_id
 */
export async function deleteGroup(villa_id: number, group_id: number) {
  return await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.deleteGroup,
    data: { group_id }
  }).then(res => res.data)
}

/**
 * 已测
 * 获取分组列表
 * @param villa_id 别野编号
 * @returns
 * type = villa
 */
export async function getGroupList(villa_id: number): Promise<{
  data: {
    list: Group
  }
}> {
  return await villaService(villa_id, {
    method: 'get',
    url: ApiEnum.getGroupList
  }).then(res => res.data)
}
/**
 * ??
 * 编辑房间
 * @param villa_id 别野编号
 * @param room_id 房间编号
 * @param room_name 房间名
 * @returns
 * type = room_id
 */
export async function editRoom(
  villa_id: number,
  room_id: number,
  room_name: object
) {
  return await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.editRoom,
    data: {
      room_id,
      room_name
    }
  }).then(res => res.data)
}
/**
 * ??
 * 删除房间
 * @param villa_id 别野编号
 * @param room_id 房间编号
 * @returns
 * type = room_id
 */
export async function deleteRoom(villa_id: number, room_id: number) {
  return await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.deleteRoom,
    data: {
      room_id
    }
  }).then(res => res.data)
}
/**
 * 已测
 * 获取房间信息
 * @param villa_id 别野编号
 * @param room_id 房间编号
 * @returns
 * type = room_id
 */
export async function getRoom(
  villa_id: number,
  room_id: number
): Promise<{
  data: {
    room: RoomMsg
  }
}> {
  return await villaService(villa_id, {
    method: 'get',
    url: ApiEnum.getRoom,
    params: {
      room_id
    }
  }).then(res => res.data)
}
/**
 * 已测
 * 获取房间列表信息
 * @param villa_id 别野编号
 * @returns
 * type = villa_id
 */
export async function getVillaGroupRoomList(villa_id: number): Promise<{
  data: {
    list: GroupRoom
  }
}> {
  return await villaService(villa_id, {
    method: 'get',
    url: ApiEnum.getVillaGroupRoomList
  }).then(res => res.data)
}
/**
 * ******
 * 身分组api
 * ******
 */
/**
 * ??
 * 向身份组操作用户，包括把用户添加到身份组或者从身份组删除用户
 * @param villa_id 别野编号
 * @param data 配置数据
 * @returns
 * type = role_id
 */
export async function operateMemberToRole(
  villa_id: number,
  data: {
    role_id: string //
    uid: string //
    is_add: boolean //
  }
) {
  return await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.operateMemberToRole,
    data
  }).then(res => res.data)
}

/**
 * 已測
 * 创建身份组
 * @param villa_id 别野编号
 * @param data 配置数据
 * @returns
 * type = villa_id
 */
export async function createMemberRole(
  villa_id: number,
  data: {
    name: string
    color: Array<typeof ColorEnum>
    permissions: Array<typeof MemberRolePermissionEnum>
  }
): Promise<{
  data: {
    id: string
  }
}> {
  return await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.createMemberRole,
    data
  }).then(res => res.data)
}
/**
 * ??
 * 编辑身份组
 * @param villa_id 别野编号
 * @param data 配置数据
 * @returns
 * type = villa_id
 */
export async function editMemberRole(
  villa_id: number,
  data: {
    id: string
    name: string
    color: Array<typeof ColorEnum>
    permissions: Array<typeof MemberRolePermissionEnum>
  }
) {
  return await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.editMemberRole,
    data
  }).then(res => res.data)
}

/**
 * ??
 * 删除身份组
 * @param villa_id 别野编号
 * @param id 身份组编号
 * @returns
 * type = id
 */
export async function deleteMemberRole(villa_id: number, id: number) {
  return await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.deleteMemberRole,
    data: {
      id
    }
  }).then(res => res.data)
}

/**
 * 已测
 * 获取大别野下所有身份组
 * @param villa_id 别野编号
 * @returns
 * type = villa_id
 */
export async function getVillaMemberRoles(villa_id: number): Promise<{
  data: {
    list: MemberRoleList[]
  }
}> {
  return await villaService(villa_id, {
    method: 'get',
    url: ApiEnum.getVillaMemberRoles
  }).then(res => res.data)
}

/**
 * 获取身份组
 * @param villa_id 别野编号
 * @param role_id 身份组编号
 * @returns
 * type = role_id
 */
export async function getMemberRoleInfo(villa_id: number, role_id: number) {
  return await villaService(villa_id, {
    method: 'get',
    url: ApiEnum.getMemberRoleInfo,
    params: {
      role_id
    }
  }).then(res => res.data)
}

/**
 * ******
 * 表态api
 * ******
 */

/**
 * 获取获取指定消息的全量表情
 * @param villa_id 别野编号
 * @returns
 * type = villa_id
 */
export async function getAllEmoticons(villa_id: number): Promise<{
  data: Emoticon[]
}> {
  return await villaService(villa_id, {
    method: 'get',
    url: ApiEnum.getAllEmoticons
  }).then(res => res.data)
}

/**
 * ******
 * 审核api
 * ******
 */

/**
 * 审核
 * @param villa_id 别野编号
 * @returns
 * type = user
 */
export async function audit(
  villa_id: number,
  data: {
    audit_content: string // 待审核内容，必填
    pass_through?: string // 透传信息，该字段会在审核结果回调时携带给开发者，选填
    room_id?: number // 房间 id，选填
    uid: number // 用户 id, 必填
  }
): Promise<{
  data: { audit_id: string }
}> {
  return await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.audit,
    data
  }).then(res => res.data)
}
