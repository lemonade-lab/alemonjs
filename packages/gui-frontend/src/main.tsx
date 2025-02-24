import { createRoot } from 'react-dom/client'
import '@/input.scss'
import '@alemonjs/react-ui/theme'
import '@alemonjs/react-ui/style.css'
import App from '@/pages/App'
createRoot(document.getElementById('root')!).render(<App />)

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
