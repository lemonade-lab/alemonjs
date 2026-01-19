import { defineConfig } from 'lvyjs';
export default defineConfig({
  build: {
    OutputOptions: {
      dir: 'bin'
    },
    typescript: {
      removeComments: true,
      declaration: true
    }
  }
});
