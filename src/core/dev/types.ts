/**
 * 索引节点
 */
export interface NodeDataType {
  /**
   * 应用归属
   */
  name: string
  /**
   * 集合id
   */
  acount: number
  /**
   * 实例名
   */
  example: string
  /**
   * 正则
   */
  reg: RegExp
  /**
   * 事件
   */
  event: string
  /**
   * 类型
   */
  typing: string
  /**
   * 优先级
   */
  priority: number
  /**
   * 方法
   */
  func: string
}
