// 扩展 window
type API = {
  postMessage: (data: any) => void
  onMessage: (callback: (data: any) => void) => void
}

declare global {
  interface Window {
    createDesktopAPI: () => API
    API: API
  }
}
