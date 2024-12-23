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

/**
 *
 */
const config: any[] = []

const BuildByName = (name: string) => {
  const input = `packages/${name}/src/index.ts`
  const dir = `packages/${name}/lib`
  const inc = `packages/${name}/src/**/*`
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

const build = () => {
  const builds = [
    'alemonjs',
    'discord',
    'qq',
    'onebot',
    'kook',
    'qq-group-bot',
    'qq-guild-bot',
    'telegram',
    'gui',
    'wechat'
  ]
  if (process.env.build == 'all') {
    builds.forEach(name => {
      BuildByName(name)
    })
  } else if (process.env.build == 'discord') {
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
  } else if (process.env.build == 'telegram') {
    BuildByName('telegram')
  } else if (process.env.build == 'gui') {
    BuildByName('gui')
  } else if (process.env.build == 'wechat') {
    BuildByName('wechat')
  } else {
    BuildByName('alemonjs')
  }
}

build()

export default defineConfig(config.flat(Infinity))
