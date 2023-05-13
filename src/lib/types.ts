import { IMessage, IUser, ReactionObj, IMember, AvailableIntentsEventsEnum,  MessageReference} from 'qq-guild-bot'
import { PathLike } from 'fs'

export enum ScreenshotType {
  JPEG = 'jpeg',
  PNG = 'png',
  WEBP = 'webp'
}

export type ButtomMsgType = {
  //消息文本
  desc: string
  //消息链接
  link?: string
}

export interface SegmentType {
  /**
   * 回复消息
   * @param msg_id
   * @returns obj
   */
  reply: (msg_id: string) => object
  /**
   * 发送url图片
   * @param image
   * @returns obj
   */
  url: (msg_id: string) => object
  /**
   * 创建at元素
   * @param uid
   * @returns conten
   */
  at: (uid: string) => string
  /**
   * 创建at全体元素
   * @returns
   */
  atall: (uid: string) => string
  /**
   * 字符串表情
   * @param type 表情类型
   * @param id 编号
   * @returns conten
   */
  expression: (type: number, id: number) => string
  /**
   * 创建表情元素
   * @param id   表情ID
   * @returns conten
   */
  face: (id: string | number) => string
  /**
   * @param channel_id 需要跳转的子频道ID
   * @returns conten
   */
  channel: (channel_id: string) => string
  /**
   * 创建图片元素
   * @returns obj
   */
  image: (url: string) => object
  /**
   * 创建图片元素
   * @returns obj
   */
  video: () => void
  /**
   * 卡片消息对象
   * @param title 标题:'小黑子'
   * @param prompt 消息弹窗内容:'消息通知'
   * @param url 缩略图地址:'xxx.png'
   * @param fields 消息数组:['鸡你太美','😁继续努力']
   * @returns obj
   */
  embed: (title: string, prompt: string, url: string, arr: Array<any>) => object
  /**
   * @param arr   [{
        desc: '文本',
        link: '链接'  //可选,没有将会是纯文本
      }]
   * @returns 
   */
  button: (arr: Array<ButtomMsgType>) => object
}

export interface UserType {
  //编号
  id: string
  //用户名
  username: string
  //状态
  status: number
  //是否是机器
  bot: boolean
}

export enum EType {
  /* 机器人进出频道消息 */
  GUILDS = 'GUILDS',
  /* 成员频道进出变动消息 */
  GUILD_MEMBERS = 'GUILD_MEMBERS',
  /* 私聊会话消息 */
  DIRECT_MESSAGE = 'DIRECT_MESSAGE',
  // 论坛消息:公私合并
  FORUMS = 'FORUMS',
  // 会话消息:公私合并
  MESSAGES = 'MESSAGES',
  /* 频道表情点击会话消息 */
  GUILD_MESSAGE_REACTIONS = 'DIRECT_MESSAGE',
  /* 互动事件监听 */
  INTERACTION = 'DIRECT_MESSAGE',
  /* 音频事件 */
  AUDIO_ACTION = 'AUDIO_ACTION'
}

export interface CmdType {
  GUILDS: object | Array<any>
  GUILD_MEMBERS: object | Array<any>
  DIRECT_MESSAGE: object | Array<any>

  /* 频道会话消息:(私)(废弃) */
  GUILD_MESSAGES: object | Array<any>
  /* 频道会话消息:(公)(废弃) */
  PUBLIC_GUILD_MESSAGES: object | Array<any>
  FORUMS: object | Array<any>
  /* 论坛消息:(公)(废弃) */
  FORUMS_EVENT: object | Array<any>
  /* 论坛消息:(私)(废弃) */
  OPEN_FORUMS_EVENT: object | Array<any>
  MESSAGES: object | Array<any>

  GUILD_MESSAGE_REACTIONS: object | Array<any>
  INTERACTION: object | Array<any>
  AUDIO_ACTION: object | Array<any>
}

export interface BotType {
  version: number
  session_id: string
  user: UserType //机器人信息
  shard: Array<number> //分发建议
}

/** 消息类型  */
export interface MsgType extends IMessage {
  /* 机器人 */
  version: number
  session_id: string
  user: UserType //机器人信息
  shard: Array<number> //分发建议
  /* 用户 */
  message_reference: MessageReference //引用消息
  author: IUser //消息作者
  channel_name: string //子频道名称
  channel_id: string //子频道号
  content: string //消息内容
  guild_name: string //频道名
  owner_id: string //频道主
  guild_id: string //频道号
  id: string //消息id
  member: IMember //消息用户
  mentions: Array<IUser> //ai消息对象数组
  seq: number //消息间的排序,已废弃
  seq_in_channel: string //消息间的排序,仅限于子频道
  timestamp: string //消息时间
}

/** 权限类型 */
export type PermissionsType = {
  //子频道权限
  state: boolean
  //可查看
  look: boolean
  //可管理
  manage: boolean
  //可发言
  speak: boolean
  //可直播
  broadcast: boolean
  //权限权重
  botmiss: number
}

/* 身份类型 */
export type IdentityType = {
  //频道主人
  master: boolean
  //成员
  member: boolean
  //等级
  grade: string
  //管理员
  admins: boolean
  //子频道管理也
  wardens: boolean
}

/* e消息对象类型 */
export interface Messgetype {
  //消息事件
  eventId: string

  //事件类型
  event: string

  //消息类型
  eventType: string

  //消息对象
  msg: MsgType

  //是否是私域
  isPrivate: boolean

  //是否是私聊
  isGroup: boolean

  //是否是撤回
  isRecall: boolean

  // 艾特得到的qq
  atuid: IUser[]

  // 是否艾特
  at: boolean

  //是否是机器人主人:该功能暂定
  isMaster: boolean

  //用户权限
  user_permissions: PermissionsType

  //机器人权限(如机器人无权限:即非管理员,不可获取用户权限)
  bot_permissions: PermissionsType

  //身份(触发该消息的用户的身份)
  identity: IdentityType

  //去除了艾特后的消息
  cmd_msg: string

  //消息发送机制
  reply: (content?: string | object, obj?: object) => Promise<boolean>

  //发送本地图片
  sendImage: (file_image: PathLike, content?: string) => Promise<boolean>

  //发送截图
  postImage: (file_image: PathLike, content?: string) => Promise<boolean>

  //删除表态
  deleteEmoji: (boj: ReactionObj) => Promise<boolean>

  //发送表态
  postEmoji: (boj: ReactionObj) => Promise<boolean>
}

export interface RuleType {
  //正则
  reg?: string
  //方法(函数)
  fnc: string
}

export interface SuperType {
  //类名
  name?: string
  //类说明
  dsc?: string
  //事件响应
  event?: EType
  //事件类型
  eventType?: string
  //优先级
  priority?: number
  //正则指令匹配数组
  rule?: Array<RuleType>
}

export interface BotConfigType {
  //机器人ID
  appID: string
  //机器人token
  token: string
  //机器人权限
  intents: Array<AvailableIntentsEventsEnum>
  //是否是开发环境
  sandbox: boolean
  //密钥
  secretKey: string
  //主人ID
  masterID: string
}

type ParameterType = string | Array<RuleType> | Number | EType

/** 插件类型*/
export type PluginType = ParameterType | ((e: Messgetype, content: string) => Promise<boolean>)
