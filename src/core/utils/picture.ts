import { Component } from './component'
import { Puppeteer } from './puppeteer'
/**
 * 截图类
 */
export class Picture {
  /**
   * 浏览器控制
   */
  Pup: typeof Puppeteer.prototype = null
  /**
   * 组件控制
   */
  Com: typeof Component.prototype = null

  /**
   * 初始化组件和浏览器
   */
  constructor() {
    this.Com = new Component()
    this.Pup = new Puppeteer()
  }
}
