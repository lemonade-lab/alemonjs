import { AppMap } from './data.js'
import { type NodeDataType } from './types.js'
/**
 * ************
 * 订阅
 * ***********
 */
class Observer {
  #sb: {
    [key: string]: {
      // 定时器id
      id: any
      node: NodeDataType
    }
  } = {}
  /**
   * 发布订阅
   * @param acount
   * @param example
   * @param func
   * @param key
   * @param id
   * @returns
   */
  add(
    name: string,
    acount: number,
    example: string,
    func: string,
    key: string,
    id: any
  ) {
    const node: NodeDataType = AppMap.get(name).findByKey(acount, example, func)
    // 订阅失败
    if (!node) clearTimeout(id)
    // 订阅前把上一个取消
    this.cancel(key)
    // 记录订阅
    this.#sb[key] = {
      id, // 定时器
      node // 节点
    }
    return true
  }

  /**
   * 取消订阅
   * @param key
   */
  cancel(key: string) {
    // 取消的时候,先把定时器关闭
    if (!Object.prototype.hasOwnProperty.call(this.#sb, key)) return false
    const id = this.#sb[key].id
    clearTimeout(id)
    delete this.#sb[key]
    return true
  }

  /**
   * 寻找订阅
   * @param key
   * @returns
   */
  find(key: string) {
    // 取消的时候,先把定时器关闭
    if (!Object.prototype.hasOwnProperty.call(this.#sb, key)) return false
    return this.#sb[key]
  }
}
export const AObserver = new Observer()
