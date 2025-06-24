import { QQBotAPI } from './api.js'
import { QQBotEventMap } from './message.js'
import { config } from './config.js'
import { Options } from './typing.js'

export class QQBotClientBase extends QQBotAPI {
  #events: {
    [K in keyof QQBotEventMap]?: ((event: QQBotEventMap[K]) => any)[]
  } = {}

  /**
   * 设置配置
   * @param opstion
   */
  constructor(opstion: Options) {
    super()
    for (const key in opstion) {
      config.set(key, opstion[key])
    }
  }

  /**
   * 注册事件处理程序
   * @param key 事件名称
   * @param val 事件处理函数
   */
  on<T extends keyof QQBotEventMap>(key: T, val: (event: QQBotEventMap[T]) => any) {
    if (!this.#events[key]) {
      this.#events[key] = []
    }
    this.#events[key].push(val)
    return this
  }

  /**
   * 触发事件
   * @param key
   * @param event
   */
  emit<T extends keyof QQBotEventMap>(key: T, event: QQBotEventMap[T]) {
    if (this.#events[key]) {
      this.#events[key].forEach(fn => fn(event))
    }
  }
}
