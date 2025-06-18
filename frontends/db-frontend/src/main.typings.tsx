// 扩展 window
type API = {
  /**
   * 发送消息
   * @param data
   * @returns
   */
  postMessage: (data: any) => void
  /**
   * 监听消息
   * @param callback
   * @returns
   */
  onMessage: (callback: (data: any) => void) => void
  // 主题
  theme: {
    // 主题变量
    variables: () => void
    // 主题变化
    on: (callback: (data: any) => void) => void
  }
  // 扩展
  expansion: {
    // 获取扩展列表
    getList: () => void
    // 监听发来的 message
    on: (callback: (data: any) => void) => void
  }
}

declare global {
  interface Window {
    createDesktopAPI: () => API
    desktopAPI: API
    API: API
  }
}
