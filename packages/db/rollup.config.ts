import { config, build } from '@alemonjs/build';
import { defineConfig } from 'rollup';
build('src/index.ts');
build('src/desktop.ts');
export default defineConfig(config.flat(Infinity));
