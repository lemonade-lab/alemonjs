import { AMessage } from './typings.js'
/**
 * 会话控制器
 */
class ConversationMap extends Map {
  Sockes: {
    [key: string]: any
  } = {}
  constructor() {
    // 初始化
    super()
  }
  /**
   * 删除状态
   * @param ID
   */
  deleteState(ID: string) {
    // 删除数据
    delete this.Sockes[`conversation-state:${ID}`]
  }
  /**
   * 得到状态
   * @param ID
   * @returns
   */
  getState(ID: string) {
    return this.Sockes[`conversation-state:${ID}`]
  }
  /**
   * 设置状态
   * @param ID
   * @param state
   */
  setState(ID: string, state: any) {
    this.Sockes[`conversation-state:${ID}`] = state
  }

  /**
   * 设置状态
   * @param ID
   * @param state
   */
  passing = this.setState

  /**
   * 增加会话
   * @param key
   * @param val
   */
  add = (key: string, val: (e: AMessage, state: any) => Promise<void>) => {
    this.set(key, val)
  }

  /**
   * 移除会话
   * @param ID
   */
  remove(ID: string) {
    // 删除状态
    this.deleteState(ID)
    // 删除函数
    this.delete(ID)
  }
}
/**
 * 对话处理器
 */
export const Conversation = new ConversationMap()
