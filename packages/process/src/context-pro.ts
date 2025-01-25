import {
  sendNotification,
  sendWebviewOnMessage,
  sendActionApplicationSidebarLoad,
  processSend
} from './send.js'
import { commands } from './storage.js'
import HTMLSCRIPT from './script.js'

export class Context {
  createExtensionDir(dir: string) {
    return `resource://-/${dir.replace(/^file:\/\//, '')}`
  }

  createAction(_context: typeof this): typeof Actions.prototype {
    // @ts-ignore
    return
  }

  createSidebarWebView(_context: typeof this): typeof webView.prototype {
    // @ts-ignore
    return
  }

  /**
   * 发送通知
   * @param message
   */
  notification(message: string, typing: 'error' | 'warning' | 'default' = 'default') {
    sendNotification(message, typing)
  }

  /**
   * 监听命令
   * @param command
   * @param callback
   */
  onCommand(command: string, callback: Function) {
    commands.push({
      command: command,
      callback
    })
  }
}

export class webView {
  /**
   *  插入脚本
   */
  get #htmlScript() {
    const script = HTMLSCRIPT.replace(/<@name>/g, `'${this._name}'`)
    return script
  }

  _name: string | null = null

  __messages: Function[] = []

  constructor(_ctx: typeof Context.prototype, _name: string) {
    this._name = _name
  }

  /**
   *
   * @param {*} callback
   */
  onMessage(callback: Function) {
    this.__messages.push(callback)
  }

  /**
   * 传入消息
   * @param {*} data
   */
  postMessage(data: any) {
    sendWebviewOnMessage({
      name: this._name,
      value: data
    })
  }

  /**
   *
   * @param {*} html
   */
  loadWebView(html: string) {
    // 插入脚本
    const data = html.replace('<head>', `<head> ${this.#htmlScript} `)
    sendActionApplicationSidebarLoad(data)
  }
}

class Click {
  #event = ''

  constructor(event: string) {
    this.#event = event
  }

  // 点击logo
  onClickLogo() {
    // 点击logo
    this.#event = `${this.#event}:logo`
    processSend({
      type: this.#event,
      data: ''
    })
  }

  // 点击组件
  onClickComponent() {
    this.#event = `${this.#event}:home`
    processSend({
      type: this.#event,
      data: ''
    })
  }

  // 点击扩展
  onClickApplication() {
    this.#event = `${this.#event}:application`
    return {
      loadWebView: (html: string) => {
        this.#event = `${this.#event}:sidebar:load`
        processSend({
          type: this.#event,
          data: html
        })
      }
    }
  }

  // 点击扩展商场
  onClickExtensions() {
    this.#event = `${this.#event}:extensions`
    processSend({
      type: this.#event,
      data: ''
    })
  }

  // 点击设置
  onClickSetting() {
    this.#event = `${this.#event}:setting`
    processSend({
      type: this.#event,
      data: ''
    })
  }
}

/**
 * @description 把传输协议定义为action
 */
export class Actions {
  // 一组行为，使用:分开
  #event = ''

  _name: string | null

  /**
   *
   * @param _ctx
   * @param _name
   */
  constructor(_ctx: typeof Context.prototype, _name: string) {
    this._name = _name
  }

  /**
   *
   * @returns
   */
  create() {
    // 创建 行为
    this.#event = 'action'
    return new Click(this.#event)
  }
}
