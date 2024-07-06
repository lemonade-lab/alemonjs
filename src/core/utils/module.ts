/**
 * 获取时间请求
 * @returns
 */
const now = () => `?t=${Date.now()}`

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
  return <T = any>(path: string): Promise<T> =>
    import(
      new URL(
        `${path}${process.env.NODE_ENV == 'production' ? '' : now()}`,
        basePath
      ).href
    )
}
