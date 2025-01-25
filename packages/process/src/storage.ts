export const commands: {
  command: string
  callback: Function
}[] = []

// 存储扩展
export const storage = new Map<
  string,
  {
    // 包信息
    package: {
      name: string
      version: string
      description: string
      main: string
      exports: any
    }
    // desktop 模块
    desktop: any
    // action 模块
    action: any
    // view 模块
    view: any
  }
>()

export const getPackages = () => Array.from(storage.values()).map(item => item.package)
