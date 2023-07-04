/** alemon-bot */
import {
  IMessage,
  MessageReference,
  IUser,
  IMember,
  ReactionObj,
  GetWsParam,
  IGuild,
  IChannel,
} from "./qq-types.js";
/* 对话处理函数类型 */
export interface SockesType {
  [key: string]: any;
}
/**
 *
 */
export type ConversationHandler = (
  e: Messagetype,
  state: ConversationState
) => Promise<void>;
/**
 * 玩家信息
 */
export interface UserType {
  //编号
  id: string;
  //用户名
  username: string;
  //状态
  status: number;
  //是否是机器
  bot: boolean;
}
/**
 * 截图文件类型
 */
export enum ScreenshotType {
  JPEG = "jpeg",
  PNG = "png",
  WEBP = "webp",
}
/**
 * 消息类型
 */
export enum EType {
  /* 频道消息 */
  GUILD = "GUILD",
  /* 子频道消息 */
  CHANNEL = "CHANNEL",
  /* 成员频道进出变动消息 */
  GUILD_MEMBERS = "GUILD_MEMBERS",
  /* 审核消息 */
  MESSAGE_AUDIT = "MESSAGE_AUDIT",
  /* 私聊会话消息 */
  DIRECT_MESSAGE = "DIRECT_MESSAGE",
  // 论坛消息:公私合并
  // 论坛三类事件：
  FORUMS_THREAD = "FORUMS_THREAD", //主题
  FORUMS_POST = "FORUMS_POST", //POST
  FORUMS_REPLY = "FORUMS_REPLY", //评论
  // 会话消息:公私合并
  MESSAGES = "MESSAGES",
  // 小写兼容层
  message = "message",
  /* 频道表情点击会话消息 */
  GUILD_MESSAGE_REACTIONS = "GUILD_MESSAGE_REACTIONS",
  /* 互动事件监听 */
  INTERACTION = "INTERACTION",
  /* 音频事件 */
  AUDIO_FREQUENCY = "AUDIO_FREQUENCY",
  /* 麦克风事件 */
  AUDIO_MICROPHONE = "AUDIO_MICROPHONE",
}
/**
 * 消息判断
 */
export enum EventType {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
}
/**
 * 应用类型
 */
export interface AppType {
  [key: string]: object;
}
/**
 * 指令类型
 */
export interface CmdType {
  [key: string]: Array<any>;
}
/**
 * 机器人信息
 */
export interface BotType {
  version: number;
  session_id: string;
  user: UserType; //机器人信息
  shard: Array<number>; //分发建议
}

/** 消息类型  */
export interface MsgType extends IMessage {
  /* 机器人 */
  version: number;
  session_id: string;
  user: UserType; //机器人信息
  shard: Array<number>; //分发建议
  /* 用户 */
  message_reference: MessageReference; //引用消息
  author: IUser; //消息作者
  channel_name: string; //子频道名称
  channel_id: string; //子频道号
  content: string; //消息内容
  guild_name: string; //频道名
  owner_id: string; //频道主 // 删除
  guild_id: string; //频道号
  id: string; //消息id
  member: IMember; //消息用户
  mentions: Array<IUser>; //ai消息对象数组
  seq: number; //消息间的排序,已废弃
  seq_in_channel: string; //消息间的排序,仅限于子频道
  timestamp: string; //消息时间
}

/** 权限类型 */
export interface PermissionsType {
  //子频道权限
  state: boolean;
  //可查看
  look: boolean;
  //可管理
  manage: boolean;
  //可发言
  speak: boolean;
  //可直播
  broadcast: boolean;
  //权限权重
  botmiss: number;
}

/* 身份类型 */
export interface IdentityType {
  //频道主人
  master: boolean;
  //成员
  member: boolean;
  //等级
  grade: string;
  //管理员
  admins: boolean;
  //子频道管理也
  wardens: boolean;
}

/* 对话状态类型 */
export type ConversationState = {
  /**
   * 会话次数
   */
  step: number;
  /**
   * 携带的数据
   */
  data: Array<any> | string | number | object;
  /**
   * 携带的方法
   */
  fnc: Function;
};

/* e消息对象类型 */
export interface Messagetype {
  /**
   * 消息事件
   */
  eventId: string;
  /**
   * 事件类型
   */
  event: EType;
  /**
   * 消息类型
   */
  eventType: EventType;
  /**
   * 消息对象
   */
  msg: MsgType;
  /**
   * 是否是私域
   */
  isPrivate: boolean;
  /**
   *是否是群聊
   */
  isGroup: boolean;
  /**
   * 是否是撤回
   */
  isRecall: boolean;
  /**
   * 艾特得到的qq
   */
  atuid: IUser[];
  /**
   * 是否是艾特
   */
  at: boolean;
  /**
   * 是否是机器人主人
   */
  isMaster: boolean;
  /**
   * 身份(触发该消息的用户的身份)
   */
  identity: IdentityType; // 可以计算得出
  /**
   * 去除了艾特后的消息
   */
  cmd_msg: string;
  /**
   * 消息发送机制
   * @param content 消息 | buffer
   * @param obj  消息对象 | buffer
   * @returns
   */
  reply: (
    content?: string | object | Array<string> | Buffer,
    obj?: object | Buffer
  ) => Promise<boolean>;
  /**
   * 发送本地图片
   * @param file_image 本地地址
   * @param content
   * @returns
   */
  sendImage: (
    file_image: string | Buffer | URL,
    content?: string
  ) => Promise<boolean>;
  /**
   * 发送截图
   * @param file_image buffer
   * @param content 附带内容
   * @returns
   */
  postImage: (
    file_image: string | Buffer | URL,
    content?: string
  ) => Promise<boolean>;
  /**
   * 删除表态
   * @param boj 表情对象
   * @returns
   */
  deleteEmoji: (boj: ReactionObj) => Promise<boolean>;
  /**
   * 发送表态
   * @param boj 表情对象
   * @returns
   */
  postEmoji: (boj: ReactionObj) => Promise<boolean>;
  /**
   * 公信转私信
   * @param content 内容 | buffer
   * @param obj 消息对象 | buffer
   * @returns
   */
  replyPrivate: (
    content?: string | object | Array<string> | Buffer,
    obj?: object | Buffer
  ) => Promise<boolean>;

  /**
   * 查询机器人权限
   * @param channel_id 子频道编号
   * @param id  用户编号
   * @returns
   */
  searchBotPermissions: (
    channel_id: any,
    id: any
  ) => Promise<{
    botmiss: any;
    look: boolean;
    manage: boolean;
    speak: boolean;
    broadcast: boolean;
    state: boolean;
  }>;

  /**
   * 查询用户权限
   * @param channel_id 子频道编号
   * @param id  用户编号
   * @returns
   */
  searchUerPermissions: (
    channel_id: any,
    id: any
  ) => Promise<{
    botmiss: any;
    look: boolean;
    manage: boolean;
    speak: boolean;
    broadcast: boolean;
    state: boolean;
  }>;

  /**
   * 获取当前用户下的所有频道列表
   * @returns
   */
  getGuildList: () => Promise<boolean | IGuild[]>;

  /**
   * 获取频道详情
   * @param guildId 频道编号
   * @returns
   */
  getGuildMsg: (guildId: string) => Promise<boolean | IGuild>;

  /**
   * 获取子频道列表
   * @param guildId 频道编号
   * @returns
   */
  getChannels: (guildId: string) => Promise<boolean | IChannel[]>;

  /**
   * 获取子频道详情
   * @param channelId 子频道编号
   * @returns
   */
  getChannel: (channelId: string) => Promise<boolean | IChannel>;

  /**
   * 获取频道下指定成员的信息
   * @param guildId 频道
   * @param userId 用户
   * @returns
   */
  getGuildMemberMsg: (
    guildId: string,
    userId: string
  ) => Promise<boolean | IMember>;

  /**
   * 撤回指定消息
   * @param channelID 频道编号
   * @param messageID 消息编号
   * @param hideTip 是否隐藏
   * @returns
   */
  deleteMsg: (
    channelID: string,
    messageID: string,
    hideTip: boolean
  ) => Promise<any>;
}

/**
 * 父类属性
 * @param name 类名
 * @param dsc 类说明
 * @param event 事件响应
 * @param eventType 事件类型
 * @param priority 正则指令匹配数组
 * @param rule 事件类型
 */
export interface SuperType {
  name?: string;
  dsc?: string;
  event?: EType;
  eventType?: EventType;
  priority?: number;
  rule?: Array<{
    //正则
    reg?: RegExp | string;
    //方法(函数)
    fnc: string;
  }>;
}

/**
 * 机器人配置
 * @param secret 机器人密钥
 * @param isPrivate 是否是私域
 * @param masterID 主人编号
 * @param password 密码
 */
export interface BotConfigType extends GetWsParam {
  secret?: string;
  isPrivate: boolean;
  masterID?: string;
  password?: string;
}
