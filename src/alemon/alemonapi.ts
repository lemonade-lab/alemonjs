import { villaService } from './axois.js'
import {
  ApiEnum,
  MHYType,
  MemberDataType,
  MemberType,
  VillaType,
  MemberListType,
  BotReplyMessageType,
  Group,
  GroupRoom,
  RoomMsg,
  ColorEnum,
  MemberRolePermission,
  Emoticon,
  MemberRoleList
} from './types.js'

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
      // axiso
      const re = res.data
      // mys
      return re.data
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
    .then(res => {
      // axiso
      const re = res.data
      // mys
      return re.data
    })
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
    params: {
      uid
    }
  })
    .then(res => {
      // axiso
      const re = res.data
      // mys
      return re.data.member
    })
    .catch(err => {
      console.log(err)
      return false
    })
  console.log('getMember', ret)
  return ret
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
    params: {
      offset_str,
      size
    }
  })
    .then(res => {
      // axiso
      const re = res.data
      // mys
      return re.data
    })
    .catch(err => {
      console.log(err)
      return false
    })
  console.log('getVillaMembers', ret)
  return ret
}
/**
 * 踢出大别野用户
 * @param villa_id 别野编号
 * @param uid 用户编号
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
 * @param data 配置数据
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
 * tudo 官网文档 为 get  实际为  post
 * 撤回消息
 * @param villa_id 别野编号
 * @param data 配置数据
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
    method: 'post',
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

/**
 * 发送消息
 * @param villa_id 别野编号
 * @param data 配置数据
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
    .then(res => {
      // axiso
      const re = res.data
      // mys
      return re.data
    })
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
    .then(res => {
      // axiso
      const re = res.data
      // mys
      return re.data
    })
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
    .then(res => {
      // axiso
      const re = res.data
      // mys
      return re.data
    })
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
    method: 'get',
    url: ApiEnum.getRoom,
    params: {
      room_id
    }
  })
    .then(res => {
      // axiso
      const re = res.data
      // mys
      return re.data
    })
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
    .then(res => {
      // axiso
      const re = res.data
      // mys
      return re.data
    })
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
 * @param data 配置数据
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

/**
 * 创建身份组
 * @param villa_id 别野编号
 * @param data 配置数据
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
    .then(res => {
      // axiso
      const re = res.data
      // mys
      return re.data
    })
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
 * @param data 配置数据
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
    params: {
      role_id
    }
  })
    .then(res => {
      // axiso
      const re = res.data
      // mys
      return re.data
    })
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
    .then(res => {
      // axiso
      const re = res.data
      // mys
      return re.data
    })
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
    .then(res => {
      // axiso
      const re = res.data
      // mys
      return re.data
    })
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
    .then(res => {
      // axiso
      const re = res.data
      // mys
      return re.data
    })
    .catch(err => {
      console.log(err)
      return false
    })
  console.log('audit', ret)
  return ret
}
