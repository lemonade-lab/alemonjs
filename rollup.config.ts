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

const build1 = (name = 'alemonjs') => {
  const input = `packages/${name}/src/plugins/index.ts`
  const dir = `packages/${name}/lib/plugins`
  const inc = `packages/${name}/src/plugins/**/*`
  config.push(buildJs(input, dir, inc))
  config.push(buildDts(input, dir, inc))
}

const build2 = (name = 'alemonjs') => {
  const input = `packages/${name}/src/loader/index.ts`
  const dir = `packages/${name}/lib/loader`
  const inc = `packages/${name}/src/loader/**/*`
  config.push(buildJs(input, dir, inc))
  config.push(buildDts(input, dir, inc))
}

const build3 = (name = 'alemonjs') => {
  const input = `packages/${name}/src/loader/main.ts`
  const dir = `packages/${name}/lib/loader`
  const inc = `packages/${name}/src/loader/**/*`
  config.push(buildJs(input, dir, inc))
  config.push(buildDts(input, dir, inc))
}

const build = () => {
  if (process.env.build == 'discord') {
    BuildByName('discord')
  } else if (process.env.build == 'qq') {
    BuildByName('qq')
  } else if (process.env.build == 'onebot') {
    BuildByName('onebot')
  } else if (process.env.build == 'kook') {
    BuildByName('kook')
  } else if (process.env.build == 'group') {
    BuildByName('qq-group-bot')
  } else if (process.env.build == 'guild') {
    BuildByName('qq-guild-bot')
  } else if (process.env.build == 'readline') {
    BuildByName('readline')
  } else if (process.env.build == 'telegram') {
    BuildByName('telegram')
  } else if (process.env.build == 'jsxp') {
    BuildByName('jsxp')
  } else if (process.env.build == 'tsxp') {
    BuildByName('tsxp')
  } else if (process.env.build == 'space') {
    BuildByName('chat-space')
  } else if (process.env.build == 'lvyjs') {
    BuildByName('lvyjs')
    build1('lvyjs')
    build2('lvyjs')
    build3('lvyjs')
  } else {
    BuildByName('alemonjs')
  }
}

build()

export default defineConfig(config.flat(Infinity))
