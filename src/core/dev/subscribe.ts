import { AppMap } from './data.js'
import { NodeDataType } from './listtable.js'
/**
 * ************
 * 订阅-双key结构
 * key1 k
 * key2 c
 * val func
 * ***********
 */
export class Subscribe {
  #sb: {
    [key: string]: {
      data: any
      // 定时器id
      id: any
      node: NodeDataType
    }
  } = {}

  /**
   * 发布订阅
   * @param key
   * @param id
   * @param c
   * @param f
   * @param data
   * @returns
   */
  add(key: string, id: any, c: string, f: string, data: any) {
    let node: NodeDataType
    for (const item in AppMap.keys()) {
      // 寻找节点
      node = AppMap.get(item).find(c, f)
      if (node) break
    }
    // 订阅失败
    if (!node) clearTimeout(id)
    // 订阅前把上一个取消
    this.cancel(key)
    // 记录订阅
    this.#sb[key] = {
      data,
      id, // 定时器
      node // 节点
    }
    return true
  }

  /**
   * 取消订阅
   * @param key
   * @param c
   * @param f
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
   * @param c
   * @param f
   * @returns
   */
  find(key: string) {
    // 取消的时候,先把定时器关闭
    if (!Object.prototype.hasOwnProperty.call(this.#sb, key)) return false
    return this.#sb[key]
  }
}
