import { Messgetype } from './types'
import { promisify } from 'util'

/* Redis操作函数 */
const getAsync = promisify(redis.get).bind(redis)
const setAsync = promisify(redis.set).bind(redis)
const delAsync = promisify(redis.del).bind(redis)

/* 对话状态类型 */
export type ConversationState = {
  step: number //会话次数
  data: any
}

/* 对话处理函数类型 */
export type ConversationHandler = (e: Messgetype, state: ConversationState) => Promise<void>

/* 注册对话处理器 */
export const conversationHandlers: Map<string, ConversationHandler> = new Map()

/* 注册对话处理函数 */
conversationHandlers.set('start-conversation', async (e, state) => {
  /* 处理会话的开始 */
  console.log(`开始与用户 ${e.msg.author.id} 进行会话`)
  /* 更新会话状态 */
  state.step = 1
  /* 保存会话状态 */
  await setConversationState(e.msg.author.id, state)
})

conversationHandlers.set('continue-conversation', async (e, state) => {
  /* 处理会话的继续 */
  console.log(`用户 ${e.msg.author.id} 继续进行会话`)
  /* 更新会话状态 */
  state.step += 1
  /* 保存会话状态 */
  await setConversationState(e.msg.author.id, state)
})

conversationHandlers.set('end-conversation', async (e, state) => {
  /* 处理会话的结束 */
  console.log(`结束与用户 ${e.msg.author.id} 进行会话`)
  /* 删除会话状态 */
  await deleteConversationState(e.msg.author.id)
})

/**
 * 获取对话状态
 * @param userId 根据id获取
 * @returns
 */
export const getConversationState = async (userId: string): Promise<ConversationState | null> => {
  const state = await getAsync(`conversation-state:${userId}`)
  return state ? JSON.parse(state) : null
}

/* 保存对话状态 */
export const setConversationState = async (
  userId: string,
  state: ConversationState
): Promise<void> => {
  await setAsync(`conversation-state:${userId}`, JSON.stringify(state), 'EX', 3600)
}

/* 删除对话状态 */
export const deleteConversationState = async (userId: string): Promise<void> => {
  await delAsync(`conversation-state:${userId}`)
}
