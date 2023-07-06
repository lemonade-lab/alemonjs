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

export interface MessageContentType {
  trace: {
    visual_room_version: string
    app_version: string
    action_type: number
    bot_msg_id: string
    client: string
    env: string
    rong_sdk_version: string
  }
  mentionedInfo: {
    mentionedContent: string
    userIdList: string[]
    type: number
  }
  user: {
    portraitUri: string
    extra: string
    name: string
    alias: string
    id: string
    portrait: string
  }
  content: {
    images: never[]
    entities: {
      offset: number
      length: number
      entity: {
        type: string
        bot_id: string
      }
    }[]
    text: string
  }
}

/** 消息类型 */
export enum MHYType {
  Text = 'MHY:Text',
  Image = 'MHY:Image',
  Post = 'MHY:Post'
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
      // 不同类型事件有不同的回调数据
      SendMessage: {
        content: string // 消息
        from_user_id: number
        send_at: number
        object_name: number
        room_id: number
        nickname: string
        msg_uid: string
      }
    }
  }
  created_at: number // 事件创建事件
  id: string // 消息编号
  send_at: number // 回调事件
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
