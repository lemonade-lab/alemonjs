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
  type: 'ts' | 'js' | 'stript'
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
  /**
   * 事件屏蔽器
   */
  event: string[]
}

class AppConfig {
  data = {
    dir: '/plugins',
    main: '/main',
    type: 'stript',
    openRegex: /./,
    closeRegex: undefined,
    event: [],
    route: '/public/defset',
    regex: true
  }
  set<T extends keyof ApplicationProcessingOpsion>(
    key: T,
    val: ApplicationProcessingOpsion[T]
  ): void {
    // 当前仅当同属性名的时候才会覆盖默认配置
    if (Object.prototype.hasOwnProperty.call(this.data, key)) {
      this.data[key] = val
    }
  }
  get<T extends keyof ApplicationProcessingOpsion>(key: T) {
    return this.data[key]
  }
}
export const APPCONFIG = new AppConfig()
/**
 * 设置插件解析配置
 * @param key 配置名
 * @param val 配置值
 * @deprecated 已废弃
 */
export const setAppProCoinfg = APPCONFIG.set
/**
 * 得到插件解析配置
 * @param key 配置名
 * @returns 配置值
 * @deprecated 已废弃
 */
export const getAppProCoinfg = APPCONFIG.get
