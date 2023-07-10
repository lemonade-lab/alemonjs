import { Message } from "./typings.js";
// 对话处理函数类型
export interface SockesType {
  [key: string]: any;
}
// 对话机
export type ConversationHandler = (
  e: Message,
  state: ConversationState
) => Promise<void>;

// 截图文件类型
export enum ScreenshotType {
  JPEG = "jpeg",
  PNG = "png",
  WEBP = "webp",
}
// 事件类型
export enum EventTypeEnum {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
}
// 应用类型
export interface AppType {
  [key: string]: object;
}

// 权限类型
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

// 身份类型
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

// 对话状态类型
export type ConversationState = {
  // 会话次数
  step: number;
  // 携带的数据
  data: Array<any> | string | number | object;
  // 携带的方法
  fnc: Function;
};
