import { dirname, basename } from 'path'
import { fileURLToPath } from 'url'
import { setMessage } from './message.js'
import { setApp } from './app.js'

/**
 * 得到执行路径
 * @param url
 * @returns
 */
export function getAppPath(url: string | URL) {
  return dirname(fileURLToPath(url)).replace(/\\/g, '/')
}

/**
 * 得到执行目录
 * @param {} url
 * @returns
 */
export function getAppName(url: string | URL) {
  return basename(getAppPath(url))
}

/**
 * 创建应用对象
 * @param url import.meta.url
 * @returns
 */
export function createApps(url: string) {
  const AppName = getAppPath(url)
  return createApp(AppName)
}

/**
 * 创建应用对象
 * @param AppName
 * @returns
 */
export function createApp(AppName: string) {
  /**
   * 应用集
   */
  const apps: object = {}
  /**
   * 重名控制器
   */
  let acount = 0
  return {
    /**
     * 重定义消息
     * @param fnc
     * @returns
     */
    setMessage: (fnc: (...args: any[]) => any) => {
      try {
        setMessage(AppName, fnc)
        return true
      } catch (err) {
        console.error(err)
        return false
      }
    },
    /**
     * 创建应用
     * @param app 应用对象
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
        return true
      } catch (err) {
        console.error(err)
        return false
      }
    },
    /**
     * 挂起应用
     * @returns
     */
    mount: () => {
      try {
        setApp(AppName, apps)
      } catch (err) {
        console.error(err)
      }
    }
  }
}
