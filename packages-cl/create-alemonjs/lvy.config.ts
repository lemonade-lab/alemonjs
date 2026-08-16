import { defineConfig } from 'lvyjs';
export default defineConfig({
  build: {
    OutputOptions: {
      dir: 'bin'
    },
    tsdown: {
      dts: true
    }
  }
});
