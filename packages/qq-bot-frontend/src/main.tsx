import { createRoot } from 'react-dom/client'
import '@/input.scss'
import App from '@/pages/App'
import '@alemonjs/react-ui/theme'
import '@alemonjs/react-ui/style.css'
import './main.typing'
createRoot(document.getElementById('root')!).render(<App />)
