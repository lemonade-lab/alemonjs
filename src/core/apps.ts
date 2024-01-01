import { dirname, basename } from 'path'
import { fileURLToPath } from 'url'
import { MSG, ARG, EVENT, PRIORITY, SLICING, APP } from './cache.js'
import { AMessage, EventEnum } from './typings.js'
import { APlugin } from './plugin/plugin.js'
import { CALL } from './call.js'

/**
 * 应用路径
 * @param url
 * @returns
 */
export function importPath(url: string | URL) {
  const DirPath = getAppPath(url)
  return {
    cwd: () => DirPath,
    name: basename(DirPath)
  }
}

/**
 * 得到执行路径
 * @param url  import.meta.url
 * @returns AppName目录名
 */
export function getAppPath(url: string | URL) {
  return dirname(fileURLToPath(url)).replace(/\\/g, '/')
}

/**
 * 得到执行目录
 * @param {} url import.meta.url
 * @returns AppName目录名
 */
export function getAppName(url: string | URL) {
  return basename(getAppPath(url))
}

/**
 * 创建应用对象
 * @param url import.meta.url
   @deprecated createApp()
 * @returns 
 */
export function createApps(url: string | URL) {
  return createApp(url)
}
/**
 * 创建应用对象
 * @param url import.meta.url
 * @returns
 */
export function createApp(url: string | URL) {
  return createSubApp(getAppName(url))
}

/**
 * 创建指定名称应用
 * @param AppName
 * @returns
 */
export function createSubApp(AppName: string) {
  /**
   * 应用集
   */
  const apps: object = {}
  /**
   * 重名控制器
   */
  let acount = 0
  /**
   * 应用
   */
  const app = {
    /**
     * 设置正则默认消息
     * @param val
     * @deprecated 废弃
     * @returns
     */
    event: (val: 'MESSAGES' | 'message') => {
      try {
        EVENT.set(AppName, val)
      } catch (err) {
        console.error('APP setEvent', err)
      }
      return app
    },
    /**
     * 设置正则最低优先级
     * 当设置了500，而所有优先级为5000时
     * 则全部默认为500,但有优先级为300的子应用
     * 则仅限当前子应用优先级为300
     * @param val
     * @returns
     */
    priority: (val: number) => {
      try {
        PRIORITY.set(AppName, val)
      } catch (err) {
        console.error('APP setEvent', err)
      }
      return app
    },
    /**
     * 设置指令规则
     * @param val
     * @deprecated 废弃,请使用replace()
     * @returns
     */
    setCharacter: (val: '#' | '/') => {
      try {
        SLICING.set(AppName, {
          str: val,
          reg: /^(#|\/)/
        })
      } catch (err) {
        console.error('APP Slicing', err)
      }
      return app
    },
    /**
     * 重定义事件
     * @param fnc 回调函数
     * @deprecated 废弃,请使用reSetEvent()
     * @returns 是否成功定义
     */
    setMessage: (fnc: (...args: any[]) => any) => {
      try {
        MSG.set(AppName, fnc)
      } catch (err) {
        console.error('APP setMessage', err)
      }
      return app
    },

    /**
     * 创建应用
     * @param app 应用对象
     * @deprecated 废弃,请使用use()
     */
    component: (urlObject: object = {}) => {
      try {
        for (const item in urlObject) {
          /**
           * 如果该导出是class
           */
          if (urlObject[item].prototype) {
            if (!Object.prototype.hasOwnProperty.call(apps, item)) {
              /**
               * 不重名
               */
              apps[item] = urlObject[item]
              continue
            }
            const T = true
            while (T) {
              const keyName = `${item}$${acount}`
              if (!Object.prototype.hasOwnProperty.call(apps, keyName)) {
                /**
                 * 不重名
                 */
                apps[keyName] = urlObject[item]
                /**
                 * 重置为0
                 */
                acount = 0
                break
              } else {
                /**
                 * 加1
                 */
                acount++
              }
            }
          }
        }
      } catch (err) {
        console.error('APP component', err)
      }
      return app
    },

    /**
     * ********
     * 以上废弃
     * ********
     */

    /**
     * 参数扩展
     * @param fnc
     * @returns
     */
    setArg: (fnc: (...args: any[]) => any[] | Promise<any[]>) => {
      try {
        ARG.set(AppName, fnc)
      } catch (err) {
        console.error('APP setArg', err)
      }
      return app
    },
    /**
     * 重定义事件
     * @param fnc 回调函数
     * @returns 是否成功定义
     */
    reSetEvent: (fnc: (...args: any[]) => any) => {
      try {
        MSG.set(AppName, fnc)
      } catch (err) {
        console.error('APP setMessage', err)
      }
      return app
    },
    /**
     * 创建应用
     * @param app 应用对象
     */
    use: (
      urlObject: {
        [key: string]: typeof APlugin
      } = {}
    ) => {
      try {
        for (const item in urlObject) {
          /**
           * 如果该导出是class
           */
          if (urlObject[item].prototype) {
            if (!Object.prototype.hasOwnProperty.call(apps, item)) {
              /**
               * 不重名
               */
              apps[item] = urlObject[item]
              continue
            }
            const T = true
            while (T) {
              const keyName = `${item}$${acount}`
              if (!Object.prototype.hasOwnProperty.call(apps, keyName)) {
                /**
                 * 不重名
                 */
                apps[keyName] = urlObject[item]
                /**
                 * 重置为0
                 */
                acount = 0
                break
              } else {
                /**
                 * 加1
                 */
                acount++
              }
            }
          }
        }
      } catch (err) {
        console.error('APP use', err)
      }
      return app
    },
    /**
     * 比正则系统更优先的回调系统
     * 且无视所有event设置
     * @param event 事件
     * @param call 回调
     * @param priority 优先级
     */
    on: (
      event: (typeof EventEnum)[number],
      call: (e: AMessage) => any,
      priority = 9000
    ) => {
      try {
        CALL.set(event, call, priority)
      } catch (err) {
        console.error('APP on', err)
      }
      return app
    },
    /**
     * 消息字符串切割
     * @param str
     * @param reg
     * @returns
     */
    replace: (reg: RegExp, str: string) => {
      try {
        SLICING.set(AppName, {
          str,
          reg
        })
      } catch (err) {
        console.error('APP on', err)
      }
      return app
    },
    /**
     * 挂起应用
     * @returns
     */
    mount: () => {
      try {
        APP.set(AppName, apps)
      } catch (err) {
        console.error('APP mount', err)
      }
      return app
    }
  }
  return app
}
