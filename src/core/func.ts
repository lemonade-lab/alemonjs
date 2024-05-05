import { AEvent } from './typings.js'
import { APlugin } from './processor/plugin.js'
type MessageFunction = (e: AEvent) => Promise<boolean | undefined | void>
export class Messages {
  count = 0
  rule: {
    reg: RegExp
    fnc: string
  }[] = []
  response(reg: RegExp, fnc: MessageFunction) {
    this.count++
    const propName = `prop_${this.count}`
    this[propName] = fnc
    this.rule.push({
      reg,
      fnc: propName
    })
  }
  get ok() {
    const App = this
    class Children extends APlugin {
      constructor() {
        super({
          rule: App.rule
        })
        for (const key of App.rule) {
          if (App[key.fnc] instanceof Function) {
            this[key.fnc] = App[key.fnc].bind(App)
          }
        }
      }
    }
    return Children
  }
}
