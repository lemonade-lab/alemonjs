import { defineConfig } from 'lvyjs';
export default defineConfig({
  build: {
    typescript: {
      removeComments: true,
      declaration: true
    }
  }
});
