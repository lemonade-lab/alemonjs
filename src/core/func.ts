import {
  EventEnum,
  EventFunction,
  EventFunctionMap,
  MessageFunction,
  TypingEnum
} from './typings.js'
import { APlugin } from './processor/plugin.js'

export class Messages {
  #count = 0
  #priority = 999
  #event: (typeof EventEnum)[number] = 'MESSAGES'
  #typing: (typeof TypingEnum)[number] = 'CREATE'
  #rule: {
    reg: RegExp
    fnc: string
  }[] = []

  /**
   * 响应消息
   * @param reg
   * @param fnc
   * @returns
   */
  response(reg: RegExp, fnc: MessageFunction) {
    this.#count++
    const propName = `prop_${this.#count}`
    this[propName] = fnc
    this.#rule.push({
      reg,
      fnc: propName
    })
    return this
  }

  /**
   * 设置优先级
   * @param size
   * @returns
   */
  priority(size: number) {
    this.#priority = size
    return this
  }

  /**
   * 设置事件
   * @param val
   * @returns
   */
  event(val: (typeof EventEnum)[number]) {
    this.#event = val
    return this
  }

  /**
   * 设置类型
   * @param val
   * @returns
   */
  typing(val: (typeof TypingEnum)[number]) {
    this.#typing = val
    return this
  }

  get ok() {
    const App = this
    class Children extends APlugin {
      constructor() {
        super({
          rule: App.#rule
        })
        //
        this.priority = App.#priority
        this.event = App.#event
        this.typing = App.#typing
        //
        for (const key of App.#rule) {
          if (App[key.fnc] instanceof Function) {
            this[key.fnc] = App[key.fnc].bind(App)
          }
        }
      }
    }
    return Children
  }
}

// 把所有的event集合在一起
export class Events {
  #data: EventFunctionMap = {}
  response(event: (typeof EventEnum)[number], call: EventFunction) {
    const Event = event == 'message' ? 'MESSAGES' : event
    this.#data[Event] = call
  }
  get ok() {
    return this.#data
  }
}
