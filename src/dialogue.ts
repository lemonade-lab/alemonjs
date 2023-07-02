// 非依赖引用
import { ConversationState, ConversationHandler, SockesType } from "./types.js";
/**
 *
 */
const Sockes: SockesType = {};
/**
 *
 * @param key
 * @returns
 */
const getAsync = async (key: string) => {
  return Sockes[key];
};
/**
 *
 * @param key
 * @param val
 */
const setAsync = async (key: string, val: any) => {
  Sockes[key] = val;
  return;
};
/**
 *
 * @param key
 */
const delAsync = async (key: string) => {
  delete Sockes[key];
  return;
};

/* 注册对话处理器 */
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

/* 保存对话状态 */
export const setConversationState = async (
  userId: string,
  state: ConversationState
): Promise<void> => {
  // await setAsync(`conversation-state:${userId}`, JSON.stringify(state), 'EX', 3600)
  await setAsync(`conversation-state:${userId}`, JSON.stringify(state));
  return;
};

/* 删除对话状态 */
export const deleteConversationState = async (
  userId: string
): Promise<void> => {
  await delAsync(`conversation-state:${userId}`);
  return;
};
