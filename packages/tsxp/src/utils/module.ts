/**
 * 获取时间请求
 * @returns
 */
const now = () => (process.env.NODE_ENV == 'production' ? '' : `?t=${Date.now()}`)

/**
 * 使用import.meta.url得到require
 * @param basePath
 * @returns
 * 这并不是
 * ***
 * import { createRequire } from "module"
 * ***
 * 原型为
 * new URL(path, import.meta.url).href
 */
export const createRequire = (basePath: string) => {
  return (path: string): string => {
    if (
      process.platform === 'linux' ||
      process.platform === 'android' ||
      // macos
      process.platform === 'darwin'
    ) {
      return new URL(path, basePath).href.replace(/^file:\/\//, '')
    } else {
      // windows
      return new URL(path, basePath).href.replace(/^file:\/\/\//, '')
    }
  }
}

/**
 * ***********
 * 创建动态组件
 * @param basePath import.meta.url
 * @returns
 * 在env.NODE_ENV=='production'下禁用
 */
export const createDynamicComponent = (basePath: string) => {
  /**
   * 与import作用相同
   * @param path 相对路径
   * @returns
   */
  return <T = any>(path: string): Promise<T> => {
    if (
      process.platform === 'linux' ||
      process.platform === 'android' ||
      // macos
      process.platform === 'darwin'
    ) {
      return import(new URL(`${path}${now()}`, basePath).href.replace(/^file:\/\//, ''))
    } else {
      // windows
      return import(new URL(`${path}${now()} `, basePath).href.replace(/^file:\/\/\//, ''))
    }
  }
}
