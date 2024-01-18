import { BaseConfig } from './config.js'

export interface UserInformationType {
  id: string
  name: string
  introduce: string
  avatar: string
  bot: boolean
  joined_at: number
  role: any[]
  isMaster: boolean
}

/**
 * 频道控制器
 */

/**
 * 分组控制器
 */

/**
 * 子频道控制器
 */

/**
 * 角色控制器
 */

/**
 * 成员控制器
 */
export interface MemberControllerType {
  /**
   * 详细信息
   * @returns
   */
  information: () => Promise<UserInformationType | false>
  /**
   * 禁言
   * @param select { time?: number; cancel?: boolean }
   * @returns
   */
  mute: (option?: { time?: number; cancel?: boolean }) => Promise<any>
  /**
   * 移出频道
   * @returns
   */
  remove: () => Promise<any>
  /**
   * 身份/角色控制
   * @param role_id 角色id
   * @param add 是否添加 ture
   * @returns
   */
  operate: (role_id: string, add?: boolean) => Promise<any>
}

/**
 * 消息控制器
 */
export interface MessageControllerType {
  /**
   * 回复消息
   * @param content
   */
  reply(
    content: Buffer | string | number | (Buffer | number | string)[]
  ): Promise<{
    middle: any[]
    backhaul: any
  }>
  /**
   * 引用消息
   * @param content
   */
  quote(
    content: Buffer | string | number | (Buffer | number | string)[]
  ): Promise<any>
  /**
   * 更新信息
   */
  update(
    content: Buffer | string | number | (Buffer | number | string)[]
  ): Promise<any>
  /**
   * 撤回
   * @param time 撤回时间
   */
  withdraw(hideTip?: boolean): Promise<any>
  /**
   * 钉选---别野顶置--频道精华
   * @param cancel 取消
   */
  pinning(cancel?: boolean): Promise<any>
  /**
   * 喇叭--别野-精选--频道全局公告
   * @param cancel 取消
   */
  horn(cancel?: boolean): Promise<any>
  /**
   * 转发
   */
  forward(): Promise<any>
  /**
   * 表态
   * @param msg 表情
   * @param cancel 取消
   */
  emoji(msg: any[], cancel?: boolean): Promise<any[]>
  /**
   * 音频
   * 传入string视为url地址
   * 传入buffer视为二进制文件流发送
   * @param file
   * @param name
   */
  audio(file: Buffer | string, name?: string): Promise<any>
  /**
   * 视频
   * 传入string视为url地址
   * 传入buffer视为二进制文件流发送
   * @param file
   * @param name
   */
  video(file: Buffer | string, name?: string): Promise<any>
  /**
   * 发送卡片
   * @param msg
   */
  card(msg: any[]): Promise<any[]>
  /**
   * 得到指定消息的 指定 表情 下的 所有用户
   * @param msg
   * @param options
   */
  allUsers(msg: any, options: any): Promise<any>
  /**
   * 文章
   * @param msg
   */
  article(msg: any): Promise<any>
}

/**
 * 控制器可选参
 */
export interface ControllerOption {
  /**
   * 平台
   */
  platform: string
  /**
   * 群聊 | 私聊
   */
  attribute?: 'group' | 'single'
  /**
   * 频道号
   */
  guild_id?: string
  /**
   * 子频道号
   */
  channel_id?: string
  /**
   * 消息编号
   */
  msg_id?: string
  /**
   * 用户编号
   */
  user_id?: string
  /**
   * 私聊会话识别
   */
  open_id?: string
}

class Controllers extends BaseConfig<ControllerOption> {
  /**
   * 构造
   * @param select
   */
  constructor(select?: ControllerOption) {
    super(select)
  }
  /**
   * 消息控制器
   * @param param0
   * @returns
   */
  Message: MessageControllerType
  /**
   * 成员控制器
   * @param param0
   * @returns
   */
  Member: MemberControllerType
}

export type ControllersType = typeof Controllers
