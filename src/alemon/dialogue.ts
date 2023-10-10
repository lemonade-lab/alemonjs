import { AMessage } from './typings.js'

/**
 * 对话处理函数类型
 */
export interface SockesType {
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
 * 对话接口
 */
export type ConversationHandler = (e: AMessage, state: ConversationState) => Promise<void>

/**
 * 对话集
 */
export type conversationHandlersMap = Map<string, ConversationHandler>

/**
 *
 */
const Sockes: SockesType = {}

/**
 * 得到对话
 * @param key
 * @returns
 */
const getAsync = async (key: string) => {
  return Sockes[key]
}

/**
 * 设置对话
 * @param key
 * @param val
 */
const setAsync = async (key: string, val: any) => {
  Sockes[key] = val
  return
}

/**
 * 删除对话
 * @param key
 */
const delAsync = async (key: string) => {
  delete Sockes[key]
  return
}

/**
 * 注册对话处理器
 */
export const conversationHandlers: conversationHandlersMap = new Map()

/**
 * 获取对话状态
 * @param userId 根据id获取
 * @returns
 */
export const getConversationState = async (userId: string): Promise<ConversationState | null> => {
  const state = await getAsync(`conversation-state:${userId}`)
  return state ? JSON.parse(state) : null
}

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
  await setAsync(`conversation-state:${userId}`, JSON.stringify(state))
  return
}

/**
 * 删除对话状态
 * @param userId
 * @returns
 */
export const deleteConversationState = async (userId: string): Promise<void> => {
  await delAsync(`conversation-state:${userId}`)
  return
}
