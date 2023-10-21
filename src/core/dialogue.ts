import { type AMessage } from './typings.js'

/**
 * 对话处理函数集
 */
export interface SockesMap {
  [key: string]: any
}

/**
 * 对话状态类型
 */
export type ConversationState = {
  /**
   * 会话次数
   */
  step: number
  /**
   * 携带的数据
   */
  data: any
  /**
   * 携带的方法
   */
  fnc: (...args: any[]) => any
}

/**
 * 对话接口类型
 */
export type ConversationHandler = (
  e: AMessage,
  state: ConversationState
) => Promise<void>

/**
 * 对话集
 */
export type conversationHandlersMap = Map<string, ConversationHandler>

/**
 *对话缓存
 */
const Sockes: SockesMap = {}

/**
 * 得到对话
 * @param key 对话键
 * @returns 对话值
 */
const getAsync = async (key: string) => {
  return Sockes[key]
}

/**
 * 设置对话
 * @param key 对话键
 * @param val 对话值
 */
const setAsync = async (key: string, val: any) => {
  Sockes[key] = val
  return
}

/**
 * 删除对话
 * @param key 对话键
 */
const delAsync = async (key: string) => {
  delete Sockes[key]
}

/**
 * 注册对话处理器
 */
export const conversationHandlers: conversationHandlersMap = new Map()

/**
 * 获取对话状态
 * @param userId 用户编号
 * @returns 对话状态值
 */
export const getConversationState = async (
  userId: string
): Promise<ConversationState | null> => {
  const state = await getAsync(`conversation-state:${userId}`)
  return state ? JSON.parse(state) : null
}

/**
 * 设置对话状态
 * @param userId 用户编号
 * @param state 状态记录
 */
export const setConversationState = async (
  userId: string,
  state: ConversationState
): Promise<void> => {
  await setAsync(`conversation-state:${userId}`, JSON.stringify(state))
}

/**
 * 删除对话状态
 * @param userId 用户编号
 */
export const deleteConversationState = async (
  userId: string
): Promise<void> => {
  await delAsync(`conversation-state:${userId}`)
}
