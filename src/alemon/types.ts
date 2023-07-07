/** api路径地址 */
export enum ApiEnum {
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
  audit = '/vila/api/bot/platform/audit'
}

/**
 * 消息内容
 */
export interface MessageContentType {
  /**
   * 追踪
   */
  trace: {
    visual_room_version: string //可视化房间版本
    app_version: string //应用程序版本
    action_type: number // 操作类型
    bot_msg_id: string // 机器人消息编号
    client: string // 客户
    env: string // 环境
    rong_sdk_version: string //sdk版本
  }
  /**
   * 提及
   */
  mentionedInfo: {
    mentionedContent: string //提到
    userIdList: string[] //用户ID列表
    type: number //回调类型--会话消息2
  }
  /**
   * 用户
   */
  user: {
    portraitUri: string // 用户头像
    extra: string // 额外的  {"member_roles":{},"state":null} 需要转为对象
    name: string // 用户名称
    alias: string // 别名
    id: string // 用户编号
    portrait: string // 用户头像
  }
  /**
   * 内容
   */
  content: {
    images: never[] // 文本+图片
    entities: {
      offset: number
      length: number
      entity: {
        type: string
        bot_id: string
      }
    }[]
    text: string // 消息文本
  }
}

// 机器人模板信息
export type BotTemplate = {
  id: string // 机器人编号
  name: string // 机器人名称
  desc: string // 机器人说明
  icon: string // 机器人头像
  commands: {
    name: string // 指令
    desc: string // 指令说明
  }[]
}

/** 机器人接收类型 */
export type BotEvent = {
  // 机器人相关信息
  robot: {
    template: BotTemplate
    villa_id: number // 事件所属的大别野 id
  }
  type: number // 消息类型
  extend_data: {
    EventData: {
      /** 会话消息数据包  */
      SendMessage: {
        content: string // 字符串消息合集  MessageContentType
        from_user_id: number // 来自用户id
        send_at: number // 发送事件编号
        object_name: number // 对象名称
        room_id: number // 房间号
        nickname: string // 昵称
        msg_uid: string // 消息ID
        villa_id: string // 别野编号
      }
      /**  表情表态数据包 */
      AddQuickEmoticon: {
        villa_id: number // 别野编号
        room_id: number // 房间编号
        uid: number // 用户编号
        emoticon_id: number // 表情编号
        emoticon: string // 表情说明  emoticon:狗头  =>  [狗头]
        msg_uid: string // 用户消息编号
        bot_msg_id: string // 机器人消息编号
      }
      /** 成员进入数据包  */
      JoinVilla: {
        join_uid: number // 用户编号
        join_user_nickname: string // 用户名称
        join_at: number // 进入事件编号
        villa_id: number // 别野编号
      }
      /**  机器人退出数据包 */
      DeleteRobot: {
        villa_id: number // 别野编号
      }
      /**  机器人进入数据包 */
      CreateRobot: {
        villa_id: number // 别野编号
      }
    }
  }
  created_at: number // 创建事件编号
  id: string // 消息编号
  send_at: number // 发送事件编号
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

/** 消息类型 */
export enum MHYType {
  Text = 'MHY:Text',
  Image = 'MHY:Image',
  Post = 'MHY:Post'
}

export enum RoleEnum {
  MEMBER_ROLE_TYPE_ALL_MEMBER = 'MEMBER_ROLE_TYPE_ALL_MEMBER',
  MEMBER_ROLE_TYPE_ADMIN = 'MEMBER_ROLE_TYPE_ADMIN',
  MEMBER_ROLE_TYPE_OWNER = 'MEMBER_ROLE_TYPE_OWNER',
  MEMBER_ROLE_TYPE_CUSTOM = 'MEMBER_ROLE_TYPE_CUSTOM',
  MEMBER_ROLE_TYPE_UNKNOWN = 'MEMBER_ROLE_TYPE_UNKNOWN'
}

export interface MemberRoleBasic {
  id: number // 身份组 id
  name: string // 身份组名称
  color: string // 身份组颜色
  // 身份组类型
  role_type: RoleEnum
  villa_id: number // 大别野 id
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

export interface MemberListType {
  list: MemberType[]
  next_offset?: string // 该字段已废弃
  next_offset_str?: string
}
export interface BotReplyMessageType {
  bot_msg_id: string
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

export interface MemberRole extends MemberRoleBasic {
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

export interface Emoticon {
  emoticon_id: number // 表情 id
  describe_text: string // 描述文本
  icon: string // 表情图片链接
}
