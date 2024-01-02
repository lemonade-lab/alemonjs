import { Alemon } from './alemon.js'
/**
 * 数据集
 */
class Data {
  // 应用集合
  #data: {
    [key: string]: typeof Alemon.prototype
  } = {}

  /**
   * 得到应用
   * @param key
   * @returns
   */
  get(key: string) {
    return this.#data[key]
  }

  /**
   * 设置应用
   * @param key
   * @param val
   */
  set(key: string, val: typeof Alemon.prototype) {
    this.#data[key] = val
  }

  /**
   * 删除应用
   * @param key
   */
  del(key: string) {
    delete this.#data[key]
  }

  all() {
    return this.#data
  }

  /**
   * 寻找节点
   * @param c
   * @param f
   * @returns
   */
  findNode(c: string, f: string) {
    let node
    for (const item in this.#data) {
      node = this.#data[item].find(c, f)
    }
    return node
  }
}

/**
 * 应用数据
 */
export const DATA = new Data()
