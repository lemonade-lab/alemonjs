import { createRoot } from 'react-dom/client';
import '@/input.scss';
import '@alemonjs/react-ui/theme';
import '@alemonjs/react-ui/style.css';
import App from '@/pages/App';
import '@/main.typings';
createRoot(document.getElementById('root')!).render(<App />);
