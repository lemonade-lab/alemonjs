import {
  conversationHandlers,
  deleteConversationState,
  setConversationState
} from './dialogue.js'

/**
 * 对话机
 */
export const Conversation = {
  /**
   * 设置对话状态
   * @param ID 用户编号
   * @param state 状态记录
   */
  passing: setConversationState,
  /**
   * 删除对话状态
   * @param ID 用户编号
   */
  remove: (ID: string) => {
    // 删除数据
    deleteConversationState(ID)
    // 删除函数
    conversationHandlers.delete(ID)
  },
  /**
   * 注册对话
   */
  add: conversationHandlers.set
}
