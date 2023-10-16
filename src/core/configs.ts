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

const ApplicationProcessingConfiguration: ApplicationProcessingOpsion = {
  dir: '/application',
  main: '/index',
  type: 'ts',
  openRegex: /./,
  closeRegex: undefined,
  route: '/public/defset',
  regex: true
}

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

export function getAppProCoinfg<T extends keyof ApplicationProcessingOpsion>(
  key: T
) {
  return ApplicationProcessingConfiguration[key]
}
