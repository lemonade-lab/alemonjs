import { config, build } from '@alemonjs/build'
import { defineConfig } from 'rollup'
build('src/jsx.tsx')
build('src/index.ts')
export default defineConfig(config.flat(Infinity))
