import { defineConfig, RollupOptions } from 'rollup'
import typescript from '@rollup/plugin-typescript'
import dts from 'rollup-plugin-dts'

const onwarn: RollupOptions['onwarn'] = (warning, warn) => {
  if (warning.code === 'UNRESOLVED_IMPORT') return
  warn(warning)
}

/**
 * @param {*} input
 * @param {*} dir
 * @param {*} inc
 * @returns
 */
const buildJs = (input: string, dir: string, inc: string) => {
  return {
    input: input,
    output: {
      dir: dir,
      format: 'es',
      sourcemap: false,
      preserveModules: true
    },
    plugins: [
      typescript({
        compilerOptions: {
          outDir: dir
        },
        include: [inc]
      })
    ],
    onwarn: onwarn
  } as RollupOptions
}

/**
 *
 * @param {*} input
 * @param {*} dir
 * @param {*} inc
 * @returns
 */
const buildDts = (input: string, dir: string, inc: string) => {
  return {
    input: input,
    output: {
      // lib 目录
      dir: dir,
      format: 'es',
      sourcemap: false,
      preserveModules: true
    },
    plugins: [
      typescript({
        compilerOptions: {
          outDir: dir
        },
        include: [inc]
      }),
      dts()
    ],
    onwarn: onwarn
  } as RollupOptions
}

const config: any[] = []

const build = () => {
  const input = `src/index.ts`
  const dir = `lib`
  const inc = `src/**/*`
  try {
    config.push(buildJs(input, dir, inc))
  } catch (e) {
    console.log(e)
  }
  try {
    config.push(buildDts(input, dir, inc))
  } catch (e) {
    console.log(e)
  }
}

build()

export default defineConfig(config.flat(Infinity))
