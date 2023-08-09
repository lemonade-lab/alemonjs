// 非依赖引用
import { MessageEvent } from "./typings.js";

// 对话处理函数类型
export interface SockesType {
  [key: string]: any;
}
// 存储
const Sockes: SockesType = {};

// 对话机
export type ConversationHandler = (
  e: MessageEvent,
  state: ConversationState
) => Promise<void>;
// 对话状态类型
export type ConversationState = {
  // 会话次数
  step: number;
  // 携带的数据
  data: Array<any> | string | number | object;
  // 携带的方法
  fnc: Function;
};
/**
 * 获取
 * @param key
 * @returns
 */
const getAsync = async (key: string) => {
  return Sockes[key];
};
/**
 * 设置
 * @param key
 * @param val
 */
const setAsync = async (key: string, val: any) => {
  Sockes[key] = val;
  return;
};
/**
 * 删除
 * @param key
 */
const delAsync = async (key: string) => {
  delete Sockes[key];
  return;
};

// 注册对话处理器
export const conversationHandlers: Map<string, ConversationHandler> = new Map();

/**
 * 获取对话状态
 * @param userId 根据id获取
 * @returns
 */
export const getConversationState = async (
  userId: string
): Promise<ConversationState | null> => {
  const state = await getAsync(`conversation-state:${userId}`);
  return state ? JSON.parse(state) : null;
};

/**
 * 保存对话状态
 * @param userId
 * @param state
 * @returns
 */
export const setConversationState = async (
  userId: string,
  state: ConversationState
): Promise<void> => {
  // await setAsync(`conversation-state:${userId}`, JSON.stringify(state), 'EX', 3600)
  await setAsync(`conversation-state:${userId}`, JSON.stringify(state));
  return;
};

/**
 * 删除对话状态
 * @param userId
 * @returns
 */
export const deleteConversationState = async (
  userId: string
): Promise<void> => {
  await delAsync(`conversation-state:${userId}`);
  return;
};
