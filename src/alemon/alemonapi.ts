import { villaService } from './axois.js'
import { ApiEnum, MHYType } from './types.js'
/**
 * ******
 * 鉴权api
 * ******
 */

export interface MemberBasic {
  uid: string //  用户 id
  nickname: string //  用户昵称
  introduce: string //  用户简介
  avatar_url: string // 头像地址
}

export interface MemberBasicType extends MemberBasic {
  avatar?: string //  头像 id
}

export interface MemberRoleBasic {
  id: string // 身份组 id
  name: string // 身份组名称
  color: string // 身份组颜色
  // 身份组类型
  role_type:
    | 'MEMBER_ROLE_TYPE_ALL_MEMBER'
    | 'MEMBER_ROLE_TYPE_ADMIN'
    | 'MEMBER_ROLE_TYPE_OWNER'
    | 'MEMBER_ROLE_TYPE_CUSTOM'
    | 'MEMBER_ROLE_TYPE_UNKNOWN'
  villa_id: string // 大别野 id
}

export interface MemberRoleList extends MemberRoleBasic {
  is_all_room?: boolean
  room_ids?: string[]
}

/** 用户成员信息 */
export interface MemberType {
  basic: MemberBasicType // 基础
  role_id_list: string[] // 身分组编号列表
  joined_at: string // 用户加入大别野时间戳
  role_list: MemberRoleList[] // 身分组集合
}

/** 用户别野信息 */
export interface AccessInfoType {
  uid: string // 用户编号
  villa_id: string // 别野编号
  member_access_token: string // 成员访问权限
  bot_tpl_id: string //
}

/** 用户数据 */
export interface MemberDataType {
  access_info: AccessInfoType
  member: MemberType
}
/**
 * 校验用户机器人访问凭证
 * @param villa_id 别野
 * @param token 令牌
 * @returns
 */
export async function checkMemberBotAccessToken(villa_id: number, token: string) {
  console.log(ApiEnum.checkMemberBotAccessToken)
  const ret: MemberDataType | false = await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.checkMemberBotAccessToken,
    data: {
      token
    }
  })
    .then(res => {
      // axios
      const db = res.data
      // mys
      return db.data
    })
    .catch(err => {
      console.log(err)
      return false
    })
  console.log('checkMemberBotAccessToken', ret)
  return ret
}
/**
 * ******
 * 大别野api
 * ******
 */
export interface VillaType {
  villa_id: string
  name: string
  villa_avatar_url: string
  owner_uid: string
  is_official: boolean
  introduce: string
  category_id: number
  tags: string[]
}

/**
 * 获取大别野信息
 * @param villa_id  别野编号
 * @returns
 */
export async function getVilla(villa_id: number) {
  console.log(ApiEnum.getVilla)
  const ret: VillaType | false = await villaService(villa_id, {
    method: 'get',
    url: ApiEnum.getVilla
  })
    .then(res => res.data)
    .catch(err => {
      console.log(err)
      return false
    })
  console.log('getVilla', ret)
  return ret
}
/**
 * ******
 * 用户api
 * ******
 */
/**
 * 获取用户信息
 * @param villa_id 别野
 * @param uid 用户编号
 * @returns
 */
export async function getMember(villa_id: number, uid: string) {
  console.log(ApiEnum.getMember)
  const ret: MemberType | false = await villaService(villa_id, {
    method: 'get',
    url: ApiEnum.getMember,
    data: {
      uid
    }
  })
    .then(res => res.data)
    .catch(err => {
      console.log(err)
      return false
    })
  console.log('getMember', ret)
  return ret
}
export interface MemberListType {
  list: MemberType[]
  next_offset?: string // 该字段已废弃
  next_offset_str?: string
}
/**
 * 获取大别野成员列表
 * @param villa_id  别野编号
 * @param offset_str  起始位置偏移量
 * @param size 分页大小
 * @returns
 */
export async function getVillaMembers(villa_id: number, offset_str: string, size: number) {
  console.log(ApiEnum.getVillaMembers)
  const ret: MemberListType | false = await villaService(villa_id, {
    method: 'get',
    url: ApiEnum.getVillaMembers,
    data: {
      offset_str,
      size
    }
  })
    .then(res => res.data)
    .catch(err => {
      console.log(err)
      return false
    })
  console.log('getVillaMembers', ret)
  return ret
}
/**
 * 踢出大别野用户
 * @param villa_id
 * @param uid
 * @returns
 */
export async function deleteVillaMember(villa_id: number, uid: string) {
  console.log(ApiEnum.deleteVillaMember)
  const ret: boolean = await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.deleteVillaMember,
    data: {
      uid
    }
  })
    .then(() => true)
    .catch(err => {
      console.log(err)
      return false
    })
  console.log('deleteVillaMember', ret)
  return ret
}
/**
 * *******
 * 消息api
 * *******
 */
/**
 * 置顶消息
 * @param villa_id 别野编号
 * @param data
 * @returns
 */
export async function pinMessage(
  villa_id: number,
  data: {
    msg_uid: string //消息 id
    is_cancel: boolean // 是否取消置顶
    room_id: string // 房间 id
    send_at: number // 发送时间
  }
) {
  console.log(ApiEnum.pinMessage)
  const ret: boolean = await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.pinMessage,
    data
  })
    .then(() => true)
    .catch(err => {
      console.log(err)
      return false
    })
  console.log('pinMessage', ret)
  return ret
}
/**
 * 撤回消息
 * @param villa_id 别野编号
 * @param data
 * @returns
 */
export async function recallMessage(
  villa_id: number,
  data: {
    msg_uid: string // 消息 id
    room_id: string // 房间 id
    msg_time: number // 发送时间
  }
) {
  console.log(ApiEnum.recallMessage)
  const ret: boolean = await villaService(villa_id, {
    method: 'get',
    url: ApiEnum.recallMessage,
    data
  })
    .then(() => true)
    .catch(err => {
      console.log(err)
      return false
    })
  console.log('recallMessage', ret)
  return ret
}

export interface BotReplyMessageType {
  bot_msg_id: string
}
/**
 * 发送消息
 * @param villa_id
 * @param data
 * @returns
 */
export async function sendMessage(
  villa_id: number,
  data: {
    room_id: number
    object_name: MHYType
    msg_content: string
  }
) {
  console.log(ApiEnum.sendMessage)
  const ret: BotReplyMessageType | false = await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.sendMessage,
    data
  })
    .then(res => res.data)
    .catch(err => {
      console.log(err)
      return false
    })
  console.log('sendMessage', ret)
  return ret
}

/**
 * ******
 * 房间api
 * ******
 */

/**
 * 创建分组
 * @param villa_id 别野编号
 * @param group_name 分组名
 * @returns
 */
export async function createGroup(villa_id: number, group_name: string) {
  console.log(ApiEnum.createGroup)
  const ret: string | false = await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.createGroup,
    data: { group_name }
  })
    .then(res => res.data)
    .catch(err => {
      console.log(err)
      return false
    })
  console.log('createGroup', ret)
  return ret
}
/**
 * 编辑分组
 * @param villa_id 别野编号
 * @param group_id 分组编号
 * @param group_name 分组名称
 * @returns
 */
export async function editGroup(villa_id: number, group_id: number, group_name: string) {
  console.log(ApiEnum.editGroup)
  const ret: boolean = await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.editGroup,
    data: { group_id, group_name }
  })
    .then(() => true)
    .catch(err => {
      console.log(err)
      return false
    })
  console.log('editGroup', ret)
  return ret
}
/**
 * 删除分组
 * @param villa_id 别野编号
 * @param group_id 分组编号
 * @returns
 */
export async function deleteGroup(villa_id: number, group_id: number) {
  console.log(ApiEnum.deleteGroup)
  const ret: boolean = await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.deleteGroup,
    data: { group_id }
  })
    .then(() => true)
    .catch(err => {
      console.log(err)
      return false
    })
  console.log('createGroup', ret)
  return ret
}

export interface ListRoom {
  room_id: number // 房间 id
  room_name: string // 房间名称
  room_type: string // 房间类型
  group_id: number // 分组 id
}

export enum RoomEnum {
  BOT_PLATFORM_ROOM_TYPE_CHAT_ROOM = 'BOT_PLATFORM_ROOM_TYPE_CHAT_ROOM', // 聊天房间
  BOT_PLATFORM_ROOM_TYPE_POST_ROOM = 'BOT_PLATFORM_ROOM_TYPE_POST_ROOM', // 帖子房间
  BOT_PLATFORM_ROOM_TYPE_SCENE_ROOM = 'BOT_PLATFORM_ROOM_TYPE_SCENE_ROOM', // 场景房间
  BOT_PLATFORM_ROOM_TYPE_INVALID = 'BOT_PLATFORM_ROOM_TYPE_INVALID' // 无效
}

export enum RoomDefaultNotifyEnum {
  BOT_PLATFORM_DEFAULT_NOTIFY_TYPE_NOTIFY = 'BOT_PLATFORM_DEFAULT_NOTIFY_TYPE_NOTIFY', // 默认通知
  BOT_PLATFORM_DEFAULT_NOTIFY_TYPE_IGNORE = 'BOT_PLATFORM_DEFAULT_NOTIFY_TYPE_IGNORE', // 默认免打扰
  BOT_PLATFORM_DEFAULT_NOTIFY_TYPE_INVALID = 'BOT_PLATFORM_DEFAULT_NOTIFY_TYPE_INVALID' // 无效
}

export interface Group {
  group_id: number // 分组 id
  group_name: string //分组名称
}
export interface GroupRoom extends Group {
  room_list: ListRoom[]
}
// 房间消息发送权限范围设置
export interface SendMsgAuthRange {
  is_all_send_msg: boolean
  roles: number[]
}
// 房间
export interface RoomMsg {
  room_id: number //  房间 id
  room_name: string // 房间名称
  // 房间类型
  room_type: RoomEnum
  group_id: number // 分组 id
  // 房间默认通知类型
  room_default_notify_type: RoomDefaultNotifyEnum
  send_msg_auth_range: SendMsgAuthRange //房间消息发送权限范围设置
}
/**
 * 获取分组列表
 * @param villa_id 别野编号
 * @returns
 */
export async function getGroupList(villa_id: number) {
  console.log(ApiEnum.getGroupList)
  const ret: Group | false = await villaService(villa_id, {
    method: 'get',
    url: ApiEnum.getGroupList
  })
    .then(res => res.data)
    .catch(err => {
      console.log(err)
      return false
    })
  console.log('getGroupList', ret)
  return ret
}
/**
 * 编辑房间
 * @param villa_id 别野编号
 * @param room_id 房间编号
 * @param room_name 房间名
 * @returns
 */
export async function editRoom(villa_id: number, room_id: number, room_name: object) {
  console.log(ApiEnum.editRoom)
  const ret: boolean = await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.editRoom,
    data: {
      room_id,
      room_name
    }
  })
    .then(() => true)
    .catch(err => {
      console.log(err)
      return false
    })
  console.log('editRoom', ret)
  return ret
}
/**
 * 删除房间
 * @param villa_id 别野编号
 * @param room_id 房间编号
 * @returns
 */
export async function deleteRoom(villa_id: number, room_id: number) {
  console.log(ApiEnum.deleteRoom)
  const ret: boolean = await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.deleteRoom,
    data: {
      room_id
    }
  })
    .then(() => true)
    .catch(err => {
      console.log(err)
      return false
    })
  console.log('deleteRoom', ret)
  return ret
}
/**
 * 获取房间信息
 * @param villa_id 别野编号
 * @param room_id 房间编号
 * @returns
 */
export async function getRoom(villa_id: number, room_id: number) {
  console.log(ApiEnum.getRoom)
  const ret: RoomMsg | false = await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.getRoom,
    data: {
      room_id
    }
  })
    .then(res => res.data)
    .catch(err => {
      console.log(err)
      return false
    })
  console.log('getRoom', ret)
  return ret
}
/**
 * 获取房间列表信息
 * @param villa_id 别野编号
 * @returns
 */
export async function getVillaGroupRoomList(villa_id: number) {
  console.log(ApiEnum.getVillaGroupRoomList)
  const ret: GroupRoom | false = await villaService(villa_id, {
    method: 'get',
    url: ApiEnum.getVillaGroupRoomList
  })
    .then(res => res.data)
    .catch(err => {
      console.log(err)
      return false
    })
  console.log('getVillaGroupRoomList', ret)
  return ret
}
/**
 * ******
 * 身分组api
 * ******
 */
/**
 * 向身份组操作用户，包括把用户添加到身份组或者从身份组删除用户
 * @param villa_id 别野编号
 * @param data
 * @returns
 */
export async function operateMemberToRole(
  villa_id: number,
  data: {
    role_id: string
    uid: string
    is_add: boolean
  }
) {
  console.log(ApiEnum.operateMemberToRole)
  const ret: any | false = await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.operateMemberToRole,
    data
  })
    .then(() => true)
    .catch(err => {
      console.log(err)
      return false
    })
  console.log('operateMemberToRole', ret)
  return ret
}

export enum ColorEnum {
  'a' = '#6173AB',
  'b' = '#F485D8',
  'c' = '#F47884',
  'd' = '#FFA54B',
  'e' = '#7BC26F',
  'f' = '#59A1EA',
  'g' = '#977EE1'
}

export interface Permission {
  key: string
  name: string
  describe: string
}

export interface MemberRole {
  id: number
  name: string
  villa_id: number
  color: string
  role_type: string
  is_all_room: boolean
  room_ids: number[]
  permissions: string[]
}

export interface MemberRoleResponse {
  retcode: number
  message: string
  data: {
    role: MemberRole
  }
}

// 身份组类型
export enum MemberRoleType {
  MEMBER_ROLE_TYPE_ALL_MEMBER = 'all_member', // 所有人身份组
  MEMBER_ROLE_TYPE_ADMIN = 'admin', // 管理员身份组
  MEMBER_ROLE_TYPE_OWNER = 'owner', // 大别野房主身份组
  MEMBER_ROLE_TYPE_CUSTOM = 'custom', // 其他自定义身份组
  MEMBER_ROLE_TYPE_UNKNOWN = 'unknown' // 未知
}

// 身份组可添加权限
export enum MemberRolePermission {
  MENTION_ALL = 'mention_all', // @全体全员
  RECALL_MESSAGE = 'recall_message', // 撤回消息
  PIN_MESSAGE = 'pin_message', // 置顶消息
  MANAGE_MEMBER_ROLE = 'manage_member_role', // 身份组管理
  EDIT_VILLA_INFO = 'edit_villa_info', // 编辑大别野详情
  MANAGE_GROUP_AND_ROOM = 'manage_group_and_room', // 房间及分组管理
  VILLA_SILENCE = 'villa_silence', // 禁言
  BLACK_OUT = 'black_out', // 拉黑
  HANDLE_APPLY = 'handle_apply', // 加入审核
  MANAGE_CHAT_ROOM = 'manage_chat_room', // 聊天房间管理
  VIEW_DATA_BOARD = 'view_data_board', // 查看大别野数据
  MANAGE_CUSTOM_EVENT = 'manage_custom_event', // 组织活动
  LIVE_ROOM_ORDER = 'live_room_order', // 点播房间节目
  MANAGE_SPOTLIGHT_COLLECTION = 'manage_spotlight_collection' // 设置精选消息
}
/**
 * 创建身份组
 * @param villa_id 别野编号
 * @param data
 * @returns
 */
export async function createMemberRole(
  villa_id: number,
  data: {
    name: string
    color: ColorEnum
    permissions: MemberRolePermission[]
  }
) {
  console.log(ApiEnum.createMemberRole)
  const ret: string | false = await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.createMemberRole,
    data
  })
    .then(res => res.data)
    .catch(err => {
      console.log(err)
      return false
    })
  console.log('createMemberRole', ret)
  return ret
}
/**
 * 编辑身份组
 * @param villa_id 别野编号
 * @param data
 * @returns
 */
export async function editMemberRole(
  villa_id: number,
  data: {
    id: string
    name: string
    color: ColorEnum
    permissions: MemberRolePermission[]
  }
) {
  console.log(ApiEnum.editMemberRole)
  const ret: boolean = await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.editMemberRole,
    data
  })
    .then(() => true)
    .catch(err => {
      console.log(err)
      return false
    })
  console.log('editMemberRole', ret)
  return false
}

/**
 * 删除身份组
 * @param villa_id 别野编号
 * @param id 身份组编号
 * @returns
 */
export async function deleteMemberRole(villa_id: number, id: number) {
  console.log(ApiEnum.deleteMemberRole)
  const ret: boolean = await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.deleteMemberRole,
    data: {
      id
    }
  })
    .then(() => true)
    .catch(err => {
      console.log(err)
      return false
    })
  console.log('deleteMemberRole', ret)
  return ret
}

export interface MemberRolePermissions {
  key: MemberRolePermission // 权限 key 字符串
  name: string // 权限名称
  describe: string // 权限描述
}

export interface MemberRoleList extends MemberRoleBasic {
  member_nums: string // 身份组下的成员数量
}

export interface MemberRoleListPermissions extends MemberRoleBasic {
  permissions: MemberRolePermissions[] // 身份组下的成员数量
}

/**
 * 获取身份组
 * @param villa_id 别野编号
 * @param role_id 身份组编号
 * @returns
 */
export async function getMemberRoleInfo(villa_id: number, role_id: number) {
  console.log(ApiEnum.getMemberRoleInfo)
  const ret: any | false = await villaService(villa_id, {
    method: 'get',
    url: ApiEnum.getMemberRoleInfo,
    data: {
      role_id
    }
  })
    .then(res => res.data)
    .catch(err => {
      console.log(err)
      return false
    })
  console.log('getMemberRoleInfo', ret)
  return ret
}

/**
 * 获取大别野下所有身份组
 * @param villa_id 别野编号
 * @returns
 */
export async function getVillaMemberRoles(villa_id: number) {
  console.log(ApiEnum.getVillaMemberRoles)
  const ret: MemberRoleList[] | false = await villaService(villa_id, {
    method: 'get',
    url: ApiEnum.getVillaMemberRoles
  })
    .then(res => res.data)
    .catch(err => {
      console.log(err)
      return false
    })
  console.log('getVillaMemberRoles', ret)
  return ret
}
/**
 * ******
 * 表态api
 * ******
 */
interface Emoticon {
  emoticon_id: number // 表情 id
  describe_text: string // 描述文本
  icon: string // 表情图片链接
}
/**
 * 获取全量表情
 * @param villa_id 别野编号
 * @returns
 */
export async function getAllEmoticons(villa_id: number) {
  console.log(ApiEnum.getAllEmoticons)
  const ret: Emoticon[] | false = await villaService(villa_id, {
    method: 'get',
    url: ApiEnum.getAllEmoticons
  })
    .then(res => res.data)
    .catch(err => {
      console.log(err)
      return false
    })
  console.log('getAllEmoticons', ret)
  return ret
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
 */
export async function audit(
  villa_id: number,
  data: {
    audit_content: string // 待审核内容，必填
    pass_through?: string // 透传信息，该字段会在审核结果回调时携带给开发者，选填
    room_id?: number // 房间 id，选填
    uid: number // 用户 id, 必填
  }
) {
  console.log(ApiEnum.audit)
  const ret: string | false = await villaService(villa_id, {
    method: 'post',
    url: ApiEnum.audit,
    data
  })
    .then(res => res.data)
    .catch(err => {
      console.log(err)
      return false
    })
  console.log('audit', ret)
  return ret
}
