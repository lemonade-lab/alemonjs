/**
 * 客户端配置
 */
export interface ClientConfig {
  bot_id: string
  bot_secret: string
  pub_key: string
  villa_id?: number
  token: string
}
/**
 *  api路径地址
 */
export enum ApiEnum {
  // 本地图片上传
  localImage = '/vila/api/bot/platform/getUploadImageParams',
  // 公网图转存接口
  transferImage = '/vila/api/bot/platform/transferImage',
  // 校验用户机器人访问凭证
  checkMemberBotAccessToken = '/vila/api/bot/platform/checkMemberBotAccessToken',
  // 获取大别野信息
  getVilla = '/vila/api/bot/platform/getVilla',
  // 获取用户信息
  getMember = '/vila/api/bot/platform/getMember',
  // 获取大别野成员列表
  getVillaMembers = '/vila/api/bot/platform/getVillaMembers',
  // 踢出大别野用户
  deleteVillaMember = '/vila/api/bot/platform/deleteVillaMember',
  // 置顶消息
  pinMessage = '/vila/api/bot/platform/pinMessage',
  // 撤回消息
  recallMessage = '/vila/api/bot/platform/recallMessage',
  // 发送消息
  sendMessage = '/vila/api/bot/platform/sendMessage',
  // 发送模板
  createComponentTemplate = '/vila/api/bot/platform/createComponentTemplate',
  // 创建分组
  createGroup = '/vila/api/bot/platform/createGroup',
  // 编辑分组
  editGroup = '/vila/api/bot/platform/editGroup',
  // 删除分组
  deleteGroup = '/vila/api/bot/platform/deleteGroup',
  // 获取分组列表
  getGroupList = '/vila/api/bot/platform/getGroupList',
  // 编辑房间
  editRoom = '/vila/api/bot/platform/editRoom',
  // 删除房间
  deleteRoom = '/vila/api/bot/platform/deleteRoom',
  // 获取房间信息
  getRoom = '/vila/api/bot/platform/getRoom',
  // 获取房间列表信息
  getVillaGroupRoomList = '/vila/api/bot/platform/getVillaGroupRoomList',
  // 向身份组操作用户
  operateMemberToRole = '/vila/api/bot/platform/operateMemberToRole',
  // 创建身份组
  createMemberRole = '/vila/api/bot/platform/createMemberRole',
  // 编辑身份组
  editMemberRole = '/vila/api/bot/platform/editMemberRole',
  // 删除身份组
  deleteMemberRole = '/vila/api/bot/platform/deleteMemberRole',
  // 获取身份组
  getMemberRoleInfo = '/vila/api/bot/platform/getMemberRoleInfo',
  // 获取大别野下所有身份组
  getVillaMemberRoles = '/vila/api/bot/platform/getVillaMemberRoles',
  // 获取全量表情
  getAllEmoticons = '/vila/api/bot/platform/getAllEmoticons',
  // 审核
  audit = '/vila/api/bot/platform/audit',

  // ws
  getWebsocketInfo = '/vila/api/bot/platform/getWebsocketInfo'
}

/**
 * 目前支持的内嵌实体类型
 */
export const EmbeddedEntityTypeEnum = [
  // 提及机器人
  'mentioned_robot',
  // @指定用户
  'mentioned_user',
  // @全体成员
  'mentioned_all',
  // 跳转大别野内的房间
  'villa_room_link',
  // 跳转到外部链接
  'link'
] as const

export interface EntitiesType {
  // 下角标,从0开始
  offset: number
  // 长度
  length: number
  /**
   * 描述
   */
  entity: {
    type: (typeof EmbeddedEntityTypeEnum)[number]
    // 机器人账号    提及机器人
    bot_id?: string
    // 大别野 id  房间标签
    villa_id?: string
    // 房间 id    房间标签
    room_id?: string
    //  成员id   提及成员
    user_id?: string
    // 链接
    url?: string
    // 字段为true时，跳转链接会带上含有用户信息的token
    requires_bot_access_token?: boolean
  }
}

export interface ImagesType {
  // 图片路径
  url: string
  // 图片宽度
  with: string
  // 图片高度
  height: string
}

export interface UserType {
  // 用户头像
  portraitUri: string
  // 额外的  {"member_roles":{},"state":null} 需要转为对象
  extra: string
  // 用户名称
  name: string
  // 别名
  alias: string
  // 用户编号
  id: string
  // 用户头像
  portrait: string
}

export interface MentionedInfoType {
  // 提到
  mentionedContent: string
  // 用户ID列表
  userIdList: string[]
  // 回调类型--会话消息2
  type: number
}

export interface TraceType {
  // 可视化房间版本
  visual_room_version: string
  // 应用程序版本
  app_version: string
  // 操作类型
  action_type: number
  // 机器人消息编号
  bot_msg_id: string
  // 客户
  client: string
  // 环境
  env: string
  // sdk版本
  rong_sdk_version: string
}

/**
 * 消息内容
 */
export interface MessageContentType {
  // 追踪
  trace: TraceType
  // 提及
  mentionedInfo: MentionedInfoType
  // 用户
  user: UserType
  // 内容
  content: {
    // 图片描述
    images?: ImagesType[]
    // 特效描述
    entities?: EntitiesType[]
    // 消息文本
    text?: string
  }
}

/**
 * **********
 * api
 * ***********
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

/**
 * 消息类型
 */
export const MHYEnum = ['MHY:Text', 'MHY:Image', 'MHY:Post'] as const

/**
 * 身份组类型
 */
export const RoleEnum = [
  'MEMBER_ROLE_TYPE_ALL_MEMBER',
  'MEMBER_ROLE_TYPE_ADMIN',
  'MEMBER_ROLE_TYPE_OWNER',
  'MEMBER_ROLE_TYPE_CUSTOM',
  'MEMBER_ROLE_TYPE_UNKNOWN'
] as const

/**
 *
 */
export interface MemberRoleBasic {
  id: number // 身份组 id
  name: string // 身份组名称
  color: string // 身份组颜色
  // 身份组类型
  role_type: (typeof RoleEnum)[number]
  villa_id: number // 大别野 id
}

/**
 *
 */
export interface MemberRoleList extends MemberRoleBasic {
  // 身份组下的成员数量
  member_nums: string
  is_all_room?: boolean
  room_ids?: string[]
}

/**
 * 用户成员信息
 */
export interface MemberType {
  basic: MemberBasicType // 基础
  role_id_list: string[] // 身份组编号列表
  joined_at: string // 用户加入大别野时间戳
  role_list: MemberRoleList[] // 身份组集合
}

/**
 * 用户别野信息
 */
export interface AccessInfoType {
  uid: string // 用户编号
  villa_id: string // 别野编号
  member_access_token: string // 成员访问权限
  bot_tpl_id: string //
}

/**
 * 用户数据
 */
export interface MemberDataType {
  access_info: AccessInfoType
  member: MemberType
}

/**
 *
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
 *
 */
export interface MemberListType {
  list: MemberType[]
  /**
   * This field is deprecated.
   * @deprecated Use "next_offset_str" instead.
   */
  next_offset?: string
  next_offset_str?: string
}

/**
 *
 */
export interface BotReplyMessageType {
  bot_msg_id: string
}

/**
 *
 */
export interface ListRoom {
  room_id: number // 房间 id
  room_name: string // 房间名称
  room_type: string // 房间类型
  group_id: number // 分组 id
}

/**
 * 房间类型
 */
export const RoomEnum = [
  'BOT_PLATFORM_ROOM_TYPE_CHAT_ROOM', // 聊天房间
  'BOT_PLATFORM_ROOM_TYPE_POST_ROOM', // 帖子房间
  'BOT_PLATFORM_ROOM_TYPE_SCENE_ROOM', // 场景房间
  'BOT_PLATFORM_ROOM_TYPE_INVALID' // 无效
] as const

/**
 * 房间默认通知类型
 */
export const RoomDefaultNotifyEnum = [
  'BOT_PLATFORM_DEFAULT_NOTIFY_TYPE_NOTIFY', // 默认通知
  'BOT_PLATFORM_DEFAULT_NOTIFY_TYPE_IGNORE', // 默认免打扰
  'BOT_PLATFORM_DEFAULT_NOTIFY_TYPE_INVALID' // 无效
] as const

/**
 * 组
 */
export interface Group {
  group_id: number // 分组 id
  group_name: string // 分组名称
}

/**
 * 房组
 */
export interface GroupRoom extends Group {
  room_list: ListRoom[]
}

/**
 * 房间消息发送权限范围设置
 */
export interface SendMsgAuthRange {
  is_all_send_msg: boolean
  roles: number[]
}

// 房间
export interface RoomMsg {
  room_id: number //  房间 id
  room_name: string // 房间名称
  room_type: (typeof RoomEnum)[number] // 房间类型
  group_id: number // 分组 id
  room_default_notify_type: (typeof RoomDefaultNotifyEnum)[number] // 房间默认通知类型
  send_msg_auth_range: SendMsgAuthRange // 房间消息发送权限范围设置
}

// 身份组颜色枚举
export const ColorEnum = [
  '#6173AB',
  '#F485D8',
  '#F47884',
  '#FFA54B',
  '#7BC26F',
  '#59A1EA',
  '#977EE1'
] as const

//
export interface Permission {
  key: string
  name: string
  describe: string
}

//
export interface MemberRole extends MemberRoleBasic {
  is_all_room: boolean
  room_ids: number[]
  permissions: string[]
}

//
export interface MemberRoleResponse {
  retcode: number
  message: string
  data: {
    role: MemberRole
  }
}

// 身份组类型
export const MemberRoleEnum = [
  'all_member', // 所有人身份组
  'admin', // 管理员身份组
  'owner', // 大别野房主身份组
  'custom', // 其他自定义身份组
  'unknown' // 未知
] as const

// 身份组可添加权限
export const MemberRolePermissionEnum = [
  'mention_all', // @全体全员
  'recall_message', // 撤回消息
  'pin_message', // 置顶消息
  'manage_member_role', // 身份组管理
  'edit_villa_info', // 编辑大别野详情
  'manage_group_and_room', // 房间及分组管理
  'villa_silence', // 禁言
  'black_out', // 拉黑
  'handle_apply', // 加入审核
  'manage_chat_room', // 聊天房间管理
  'view_data_board', // 查看大别野数据
  'manage_custom_event', // 组织活动
  'live_room_order', // 点播房间节目
  'manage_spotlight_collection' // 设置精选消息
] as const

//
export interface MemberRolePermissionEnums {
  // 权限 key 字符串
  key: (typeof MemberRolePermissionEnum)[number]
  // 权限名称
  name: string
  // 权限描述
  describe: string
}

// 身份组列表
export interface MemberRoleListPermissions extends MemberRoleBasic {
  permissions: MemberRolePermissionEnums[]
}

// 表情表态
export interface Emoticon {
  // 表情 id
  emoticon_id: number
  // 描述文本
  describe_text: string
  // 表情图片链接
  icon: string
}

// 图片参数
export interface ImageSizeType {
  width: number
  height: number
}

//
export interface ButtonType {
  id: string
  text: string
  type?: number
  c_type?: number
  link?: string
  input?: string
  need_callback?: boolean
  need_token?: boolean
  extra?: string
}
