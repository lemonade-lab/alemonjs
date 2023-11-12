import axios, { type AxiosRequestConfig } from 'axios'
import FormData from 'form-data'
import { createHash } from 'crypto'
import { Readable } from 'stream'
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
import { createPicFrom } from '../../core/index.js'
import { getClientConfig } from './config.js'

/**
 * 别野服务
 * @param villa_id 别野编号
 * @param config 配置
 * @returns
 */
export async function villaService(config: AxiosRequestConfig) {
  const ClientCfg = getClientConfig()
  const service = axios.create({
    baseURL: 'https://bbs-api.miyoushe.com', // 地址
    timeout: 6000, // 响应
    headers: {
      'x-rpc-bot_id': ClientCfg.bot_id, // 账号
      'x-rpc-bot_secret': ClientCfg.bot_secret // 密码
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
  villa_id: number | string,
  url: string
): Promise<{
  data: UrlType
}> {
  return await villaService({
    method: 'post',
    url: ApiEnum.transferImage,
    headers: {
      'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
    },
    data: {
      url
    }
  }).then(res => res.data)
}

/**
 * 得到请参数
 * @param villa_id
 * @param md5
 * @param ext
 * @returns
 */
export async function getImageReq(
  villa_id: number | string,
  md5: string,
  ext: string
) {
  return await villaService({
    method: 'get',
    headers: {
      'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
    },
    params: {
      md5: md5,
      ext: ext
    },
    url: ApiEnum.localImage
  }).then(res => res.data)
}

/**
 * 上传图片
 * @param villa_id
 * @param img
 * @param ImgName
 * @returns
 */
export async function uploadImage(
  villa_id: number | string,
  img: string | Buffer | Readable,
  ImgName = 'image.jpg'
) {
  // 识别文件
  const from = await createPicFrom(img, ImgName)
  if (!from) return { data: null, message: '文件创建失败' }
  const { picData, image, name } = from
  const typing = name.split('.')[1] ?? 'jpg'
  const md5Hash = createHash('md5').update(image).digest('hex')
  const uploadParams = await getImageReq(villa_id, md5Hash, typing)
  const data = uploadParams.data
  if (!data) return uploadParams
  const formData = new FormData()
  formData.append('x:extra', String(data.params.callback_var['x:extra']))
  formData.append('OSSAccessKeyId', data.params.accessid)
  formData.append('signature', data.params.signature)
  formData.append('success_action_status', data.params.success_action_status)
  formData.append('name', data.params.name)
  formData.append('callback', data.params.callback)
  formData.append('x-oss-content-type', data.params.x_oss_content_type)
  formData.append('key', data.params.key)
  formData.append('policy', data.params.policy)
  formData.append('file', picData, name)
  return axios({
    url: data.params.host,
    method: 'post',
    data: formData
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
  villa_id: number | string,
  token: string
): Promise<{
  data: MemberDataType
}> {
  return await villaService({
    method: 'post',
    url: ApiEnum.checkMemberBotAccessToken,
    headers: {
      'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
    },
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
export async function getVilla(villa_id: number | string): Promise<{
  data: {
    villa: VillaType
  }
}> {
  return await villaService({
    method: 'get',
    headers: {
      'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
    },
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
  villa_id: number | string,
  offset_str: string,
  size: number
): Promise<{
  data: {
    list: MemberListType
  }
}> {
  return await villaService({
    method: 'get',
    url: ApiEnum.getVillaMembers,
    headers: {
      'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
    },
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
  villa_id: number | string,
  uid: string | number
): Promise<{
  data: {
    member: MemberType
  }
}> {
  return await villaService({
    method: 'get',
    url: ApiEnum.getMember,
    headers: {
      'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
    },
    params: {
      uid: String(uid)
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
export async function deleteVillaMember(
  villa_id: number | string,
  uid: string | number
) {
  return await villaService({
    method: 'post',
    url: ApiEnum.deleteVillaMember,
    headers: {
      'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
    },
    data: {
      uid: String(uid)
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
  villa_id: number | string,
  data: {
    msg_uid: string | number // 消息 id
    is_cancel: boolean // 是否取消置顶
    room_id: string | number // 房间 id
    send_at: number | string // 发送时间
  }
) {
  return await villaService({
    method: 'post',
    url: ApiEnum.pinMessage,
    headers: {
      'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
    },
    data: {
      msg_uid: String(data.msg_uid), // 消息 id
      is_cancel: data.is_cancel, // 是否取消置顶
      room_id: String(data.room_id), // 房间 id
      send_at: Number(data.send_at) // 发送时间
    }
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
  villa_id: number | string,
  data: {
    msg_uid: string | number // 消息 id
    room_id: string | number // 房间 id
    msg_time: number | string // 发送时间
  }
) {
  return await villaService({
    method: 'post',
    url: ApiEnum.recallMessage,
    headers: {
      'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
    },
    data: {
      msg_uid: String(data.msg_uid), // 消息 id
      room_id: String(data.room_id), // 房间 id
      send_at: Number(data.msg_time) // 发送时间
    }
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
  villa_id: number | string,
  data: {
    room_id: number | string
    object_name: (typeof MHYEnum)[number]
    msg_content: string
  }
): Promise<{
  data: BotReplyMessageType
}> {
  return await villaService({
    method: 'post',
    url: ApiEnum.sendMessage,
    headers: {
      'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
    },
    data: {
      room_id: Number(data.room_id),
      object_name: data.object_name,
      msg_content: data.msg_content
    }
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
  villa_id: number | string,
  group_name: string
): Promise<{
  data: {
    group_id: string
  }
}> {
  return await villaService({
    method: 'post',
    url: ApiEnum.createGroup,
    headers: {
      'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
    },
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
  villa_id: number | string,
  group_id: number,
  group_name: string
) {
  return await villaService({
    method: 'post',
    url: ApiEnum.editGroup,
    headers: {
      'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
    },
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
export async function deleteGroup(villa_id: number | string, group_id: number) {
  return await villaService({
    method: 'post',
    url: ApiEnum.deleteGroup,
    headers: {
      'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
    },
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
export async function getGroupList(villa_id: number | string): Promise<{
  data: {
    list: Group
  }
}> {
  return await villaService({
    method: 'get',
    headers: {
      'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
    },
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
  villa_id: number | string,
  room_id: number | string,
  room_name: string | number
) {
  return await villaService({
    method: 'post',
    url: ApiEnum.editRoom,
    headers: {
      'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
    },
    data: {
      room_id: Number(room_id),
      room_name: String(room_name)
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
export async function deleteRoom(
  villa_id: number | string,
  room_id: number | string
) {
  return await villaService({
    method: 'post',
    url: ApiEnum.deleteRoom,
    headers: {
      'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
    },
    data: {
      room_id: String(room_id)
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
  villa_id: number | string,
  room_id: number | string
): Promise<{
  data: {
    room: RoomMsg
  }
}> {
  return await villaService({
    method: 'get',
    url: ApiEnum.getRoom,
    headers: {
      'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
    },
    params: {
      room_id: Number(room_id)
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
export async function getVillaGroupRoomList(
  villa_id: number | string
): Promise<{
  data: {
    list: GroupRoom
  }
}> {
  return await villaService({
    method: 'get',
    url: ApiEnum.getVillaGroupRoomList,
    headers: {
      'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
    }
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
  villa_id: number | string,
  data: {
    role_id: string //
    uid: string //
    is_add: boolean //
  }
) {
  return await villaService({
    method: 'post',
    headers: {
      'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
    },
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
  villa_id: number | string,
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
  return await villaService({
    method: 'post',
    headers: {
      'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
    },
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
  villa_id: number | string,
  data: {
    id: string
    name: string
    color: Array<typeof ColorEnum>
    permissions: Array<typeof MemberRolePermissionEnum>
  }
) {
  return await villaService({
    method: 'post',
    url: ApiEnum.editMemberRole,
    headers: {
      'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
    },
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
export async function deleteMemberRole(villa_id: number | string, id: number) {
  return await villaService({
    method: 'post',
    url: ApiEnum.deleteMemberRole,
    headers: {
      'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
    },
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
export async function getVillaMemberRoles(villa_id: number | string): Promise<{
  data: {
    list: MemberRoleList[]
  }
}> {
  return await villaService({
    method: 'get',
    headers: {
      'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
    },
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
export async function getMemberRoleInfo(
  villa_id: number | string,
  role_id: number
) {
  return await villaService({
    method: 'get',
    url: ApiEnum.getMemberRoleInfo,
    headers: {
      'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
    },
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
export async function getAllEmoticons(villa_id: number | string): Promise<{
  data: Emoticon[]
}> {
  return await villaService({
    method: 'get',
    headers: {
      'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
    },
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
 * @param data
 * @returns
 */
export async function audit(
  villa_id: number | string,
  data: {
    audit_content: string // 待审核内容，必填
    pass_through?: string // 透传信息，该字段会在审核结果回调时携带给开发者，选填
    room_id?: number | string // 房间 id，选填
    uid: number // 用户 id, 必填
  }
): Promise<{
  data: { audit_id: string }
}> {
  data.room_id = Number(data.room_id)
  return await villaService({
    method: 'post',
    headers: {
      'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
    },
    url: ApiEnum.audit,
    data
  }).then(res => res.data)
}
