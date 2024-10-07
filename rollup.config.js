import { defineConfig } from 'rollup'
import typescript from '@rollup/plugin-typescript'
import dts from 'rollup-plugin-dts'

/**
 * @param {*} input
 * @param {*} dir
 * @param {*} inc
 * @returns
 */
const buildJs = (input, dir, inc) => {
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
  }
}

/**
 *
 * @param {*} input
 * @param {*} dir
 * @param {*} inc
 * @returns
 */
const buildDts = (input, dir, inc) => {
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
  }
}

/**
 *
 */
const config = []

const BuildByName = name => {
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
  if (process.env.BN == 'discord') {
    BuildByName('discord')
  } else if (process.env.BN == 'qq') {
    BuildByName('qq')
  } else if (process.env.BN == 'kook') {
    BuildByName('kook')
  } else if (process.env.BN == 'group') {
    BuildByName('qq-group-bot')
  } else if (process.env.BN == 'guild') {
    BuildByName('qq-guild-bot')
  } else if (process.env.BN == 'readline') {
    BuildByName('readline')
  } else if (process.env.BN == 'telegram') {
    BuildByName('telegram')
  } else if (process.env.BN == 'jsxp') {
    BuildByName('jsxp')
  } else if (process.env.BN == 'tsxp') {
    BuildByName('tsxp')
  } else if (process.env.BN == 'space') {
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
