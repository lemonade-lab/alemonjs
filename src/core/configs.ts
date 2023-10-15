interface ApplicationProcessingOpsion {
  dir: string
  main: string
  type: 'ts' | 'js'
  openRegex: RegExp
  closeRegex: RegExp | undefined
  route: string
}

const ApplicationProcessingConfiguration: ApplicationProcessingOpsion = {
  // 根目录
  dir: '/application',
  // 主函数
  main: '/index',
  type: 'ts',
  // 打开正则
  openRegex: /./,
  // 屏蔽正则
  closeRegex: undefined,
  // 指令生成地址
  route: '/public/defset'
}

export function setAppProCoinfg<T extends keyof ApplicationProcessingOpsion>(
  key: T,
  val: ApplicationProcessingOpsion[T]
): void {
  // 当前仅当同属性名的时候才会覆盖默认配置
  if (
    Object.prototype.hasOwnProperty.call(
      ApplicationProcessingConfiguration,
      val
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
