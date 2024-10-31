import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
export class Store {
  #valyes = null
  #dir = './data/@alemonjs/qq/bot.json'
  constructor() {
    this.#create()
  }

  /**
   *
   */
  #create() {
    if (!existsSync(this.#dir)) {
      mkdirSync(dirname(this.#dir), { recursive: true })
      writeFileSync(
        this.#dir,
        JSON.stringify({
          // 运行时间
          RunAt: null
        })
      )
    }
  }

  /**
   *
   */
  #update() {
    // 尝试判断
    this.#create()
    // 获取数据
    const data = readFileSync(this.#dir, 'utf-8')
    return JSON.parse(data)
  }

  /**
   *
   * @returns
   */
  setItem(val: { [key: string]: any }) {
    // 确保数据文件存在
    this.#create()
    writeFileSync(this.#dir, JSON.stringify(val))
    return
  }

  /**
   *
   * @returns
   */
  getItem() {
    if (this.#valyes) return this.#valyes
    return this.#update()
  }
}
