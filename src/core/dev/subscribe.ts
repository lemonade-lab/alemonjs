import { AppMap } from './data.js'
/**
 * ************
 * 订阅-双key结构
 * key1 user_id
 * key2 calss
 * val xxxx
 * ***********
 */
export class Subscribe {
  #sb: {
    [key: string]: {
      id: any
      node: any
    }
  } = {}
  /**
   * 发布订阅
   * @param key
   * @param id
   * @param c
   * @param f
   * @returns
   */
  add(key: string, id: any, c: string, f: string) {
    let con = false
    for (const item in AppMap.keys()) {
      // 寻找节点
      const node = AppMap.get[item].find(c, f)
      if (node) {
        con = true
        // 记录订阅
        this.#sb[key] = {
          id, // 定时器
          node // 节点
        }
        break
      }
    }
    // 订阅失败
    if (!con) clearTimeout(id)
    return con
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
