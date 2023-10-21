interface ApplicationProcessingOpsion {
  /**
   * 根目录
   */
  dir: string
  /**
   * 主文件
   */
  main: string
  /**
   * 主文件类型
   */
  type: 'ts' | 'js'
  /**
   * 匹配正则
   */
  openRegex: RegExp
  /**
   * 不匹配正则
   */
  closeRegex: RegExp | undefined
  /**
   * 指令json路由
   */
  route: string
  /**
   * 是否生成json
   */
  regex: boolean
}

/**
 * ***********
 * 插件解析配置
 * ***********
 */
const ApplicationProcessingConfiguration: ApplicationProcessingOpsion = {
  dir: '/application',
  main: '/index',
  type: 'ts',
  openRegex: /./,
  closeRegex: undefined,
  route: '/public/defset',
  regex: true
}

/**
 * 设置插件解析配置
 * @param key 配置名
 * @param val 配置值
 */
export function setAppProCoinfg<T extends keyof ApplicationProcessingOpsion>(
  key: T,
  val: ApplicationProcessingOpsion[T]
): void {
  // 当前仅当同属性名的时候才会覆盖默认配置
  if (
    Object.prototype.hasOwnProperty.call(
      ApplicationProcessingConfiguration,
      key
    )
  ) {
    ApplicationProcessingConfiguration[key] = val
  }
}

/**
 * 得到插件解析配置
 * @param key 配置名
 * @returns 配置值
 */
export function getAppProCoinfg<T extends keyof ApplicationProcessingOpsion>(
  key: T
) {
  return ApplicationProcessingConfiguration[key]
}
