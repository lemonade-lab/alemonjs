import { defineConfig } from 'lvyjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export default defineConfig({
  plugins: [],
  alias: {
    entries: [{ find: '@src', replacement: join(__dirname, 'src') }]
  }
});
