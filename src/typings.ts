// 消息对象
export interface MessageEvent
  extends ReactionController,
    MuteController,
    UserController,
    IdentityGroupController,
    ChannelController,
    GuildController,
    ReplyController,
    WithdrawController,
    InteractiveController {
  guild: GuildBasice
  channel: ChannelBasice
  user: UserBasice
  robot: RobotBasice
  message: MessageBasice
  event: EventBasice
}

// 事件枚举
export enum EventEnum {
  // 频道|别野消息
  GUILD_MESSAGE = 'GUILD_MESSAGE',
  // 子频道|房间消息
  CHANNEL_MESSAGE = 'CHANNEL_MESSAGE',
  // 成员进出消息
  MEMBER_MESSAGE = 'MEMBER_MESSAGE',
  // 审核消息
  AUDIT_MESSAGE = 'AUDIT_MESSAGE',
  // 会话消息
  MESSAGES = 'MESSAGES',
  // 会话消息
  message = 'message',
  // 私聊会话消息
  PRIVATE_MESSAGE = 'PRIVATE_MESSAGE',
  // 论坛主题
  FORUMS_THREAD = 'FORUMS_THREAD',
  // 论坛推送
  FORUMS_POST = 'FORUMS_POST',
  // 论坛评论
  FORUMS_REPLY = 'FORUMS_REPLY',
  // 表态消息
  REACTIONS_MESSAGE = 'REACTIONS_MESSAGE',
  // 音频事件
  AUDIO_FREQUENCY = 'AUDIO_FREQUENCY',
  // 麦克风事件
  AUDIO_MICROPHONE = 'AUDIO_MICROPHONE'
}

// 事件类型
export enum EventTypeEnum {
  // 创建|增加| 推送
  CREATE = 'CREATE',
  // 更新|变更
  UPDATE = 'UPDATE',
  // 删除|移除
  DELETE = 'DELETE'
}

// 子频道基础信息
export interface ChannelBasice {
  // 子频道编号
  id: string
  // 子频道名
  name: string
  // 子频道类ing
  type: string
}

// 频道基础信息
export interface GuildBasice {
  // 频道编号
  id: string
  // 频道名
  name: string
  // 频道头像
  icon: string
}

// 用户基础信息
export interface UserBasice {
  // 编号
  id: string
  // 昵称
  name: string
  // 是机器人？
  bot: boolean
  // 头像地址
  avatar: string
  // 主人？
  master: boolean
}

// 机器人基础信息
export interface RobotBasice {
  // 编号
  id: string
  // 昵称
  name: string
  // 是机器人？
  bot: boolean
  // 头像地址
  avatar?: string
}

// 消息基础信息
export interface MessageBasice {
  // 编号
  id: string
  // 发送时间
  time: string
  // 公域
  publickSphere: boolean
  // 私域
  privateSphere: boolean
  // 是群聊(房间/子频道)
  groupChat: boolean
  // 是艾特？  注：机器人@不算@
  at?: boolean
  // @得到的UID集
  atuid?: Array<string>
  // 是撤回？
  recall?: boolean
  // 被处理后的消息内容
  content?: string
  // 消息原文本
  text?: string
}

// 事件基础信息
export interface EventBasice {
  // 事件编号
  id: string
  // 事件归属
  belong: EventEnum
  // 创建/更新/删除
  type: EventTypeEnum | undefined
}

// 回复控制器
export interface ReplyController {
  /**
   * 字符消息
   * @param msg 消息文本
   * @param img 图片元素
   * @returns
   */
  reply: (msg: string | Buffer, img: Buffer) => Promise<string | boolean>
  /**
   * 图片消息
   * @param msg
   * @param obj
   * @returns
   */
  replyImage: (
    // 消息文本
    msg:
      | string
      | {
          // url地址
          image: string
        },
    obj: {
      // url 地址
      image: string
    }
  ) => Promise<string | boolean>
  /**
   * 卡片消息
   * @param obj
   * @returns
   */
  replyCard: (obj: object) => Promise<string | boolean>
  /**
   * 链接消息
   * @param obj
   * @returns
   */
  replyLink: (obj: object) => Promise<string | boolean>
  /**
   * 标题消息
   * @param obj
   * @returns
   */
  replyTitle: (obj: object) => Promise<string | boolean>
  /**
   * 转发消息
   * @param obj
   * @returns
   */
  replyForward: (obj: object) => Promise<string | boolean>
  /**
   * 通知消息
   * @param obj
   * @returns
   */
  replyNotice: (obj: object) => Promise<string | boolean>
  /**
   * 按钮消息
   * @param obj
   * @returns
   */
  replyButtom: (obj: object) => Promise<string | boolean>
  /**
   * 引用消息
   * @param obj
   * @returns
   */
  replyQuote: (obj: object) => Promise<string | boolean>
  /**
   * 表态消息
   * @param mid 消息编号
   * @param obj 表情对象
   * @returns
   */
  replyReaction: (mid: string, obj: object) => Promise<string | boolean>
  /**
   * 回复消息
   * @param mid  消息编号
   * @param msg 消息内容
   * @returns
   */
  replyMsg: (mid: string, msg: string) => Promise<string | boolean>
}

// 特殊消息交互控制器
export interface InteractiveController {
  // 艾特用户
  interactiveAt: (uid: string) => string
  // 艾特全体
  interactiveAtAll: () => string
  // 引用频道
  interactiveChannel: (nid: string) => string
  // 系统表情
  interactiveFace: (obj: object) => string
}

// 撤回控制器
export interface WithdrawController {
  // 撤回消息
  withdraw: Function
  // 撤回表态
  withdrawReation: Function
}

// 频道控制器
export interface GuildController {
  // 得到频道列表
  getGuild: Function
  // 得到指定频道信息
  getGuildMsg: Function
  // 得到指定频道用户
  getGuildUsers: Function
  // 删除指定频道用户
  deteteGuildUser: Function
  // 创建频道公告
  createGuildAnnounce: Function
  // 删除频道公告
  deleteGuildAnnounce: Function
}

// 子频道控制器
export interface ChannelController {
  // 得到子频道列表
  getChannel: Function
  // 得到子频道信息
  getChannelMsg: Function
  // 创建子频道
  createChannel: Function
  // 更新子频道
  updateChannel: Function
  // 删除子频道
  deleteChannel: Function
  // 得到子频道权限
  getChannelPermissions: Function
  // 更新子频道权限
  updataChannelPermissions: Function
  // 创建子频道精华
  createChannelAnnounce: Function
  // 创建子频道精华
  deleteChannelAnnounce: Function
  // 创建
  createChannelEssence: Function
  // 得到
  getChannelEssence: Function
  // 删除
  deleteChannelEssence: Function
}

// 身分组控制器
export interface IdentityGroupController {
  // 得到身分组
  getIdentityGroup: Function
  // 得到身分组信息
  getIdentityGroupMsg: Function
  // 创建身分组
  createIdentityGroup: Function
  // 更新身分组
  updataIdentityGroup: Function
  // 删除身分组
  deleteIdentityGroup: Function
  // 得到身分组权限
  getIdentityGroupPermissions: Function
  // 更新身份组权限
  updataIdentityGroupPermissions: Function
}

// 用户控制器
export interface UserController {
  // 得到用户信息
  getUserMsg: Function
}

// 禁言控制器
export interface MuteController {
  // 全体禁言
  muteAll: Function
  // 成员禁言
  muteMember: Function
  // 部分成员禁言
  muteMembers: Function
}

// 表态控制器
export interface ReactionController {
  // 得到表态列表
  getReaction: Function
}
