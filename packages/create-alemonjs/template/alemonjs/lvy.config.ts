import { defineConfig } from 'lvyjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const includes = (value: string) => process.argv.includes(value);
const alemonjs = () => import('alemonjs').then(res => res.start('src/index.ts'));
const jsxp = () => import('jsxp').then(res => res.createServer());
export default defineConfig({
  plugins: [
    () => {
      if (includes('--view')) return jsxp;
      return alemonjs;
    }
  ],
  alias: {
    entries: [{ find: '@src', replacement: join(__dirname, 'src') }]
  }
});
