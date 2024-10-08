import { defineConfig, RollupOptions } from 'rollup'
import typescript from '@rollup/plugin-typescript'
import dts from 'rollup-plugin-dts'

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
    onwarn: (warning, warn) => {
      if (warning.code === 'UNRESOLVED_IMPORT') return
      warn(warning)
    }
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
    onwarn: (warning, warn) => {
      if (warning.code === 'UNRESOLVED_IMPORT') return
      warn(warning)
    }
  } as RollupOptions
}

/**
 *
 */
const config: any[] = []

const BuildByName = (name: string) => {
  const input = `packages/${name}/src/index.ts`
  const dir = `packages/${name}/lib`
  const inc = `packages/${name}/src/**/*`
  config.push(buildJs(input, dir, inc))
  config.push(buildDts(input, dir, inc))
}

const build1 = () => {
  const input = `packages/alemonjs/src/plugins/index.ts`
  const dir = `packages/alemonjs/lib/plugins`
  const inc = `packages/alemonjs/src/plugins/**/*`
  config.push(buildJs(input, dir, inc))
  config.push(buildDts(input, dir, inc))
}

const build2 = () => {
  const input = `packages/alemonjs/src/loader/index.ts`
  const dir = `packages/alemonjs/lib/loader`
  const inc = `packages/alemonjs/src/loader/**/*`
  config.push(buildJs(input, dir, inc))
  config.push(buildDts(input, dir, inc))
}

const build3 = () => {
  const input = `packages/alemonjs/src/loader/main.ts`
  const dir = `packages/alemonjs/lib/loader`
  const inc = `packages/alemonjs/src/loader/**/*`
  config.push(buildJs(input, dir, inc))
  config.push(buildDts(input, dir, inc))
}

const build = () => {
  if (process.env.B == 'discord') {
    BuildByName('discord')
  } else if (process.env.B == 'qq') {
    BuildByName('qq')
  } else if (process.env.B == 'onebot') {
    BuildByName('onebot')
  } else if (process.env.B == 'kook') {
    BuildByName('kook')
  } else if (process.env.B == 'group') {
    BuildByName('qq-group-bot')
  } else if (process.env.B == 'guild') {
    BuildByName('qq-guild-bot')
  } else if (process.env.B == 'readline') {
    BuildByName('readline')
  } else if (process.env.B == 'telegram') {
    BuildByName('telegram')
  } else if (process.env.B == 'jsxp') {
    BuildByName('jsxp')
  } else if (process.env.B == 'tsxp') {
    BuildByName('tsxp')
  } else if (process.env.B == 'space') {
    BuildByName('chat-space')
  } else {
    BuildByName('alemonjs')
    build1()
    build2()
    build3()
  }
}

build()

export default defineConfig(config.flat(Infinity))
