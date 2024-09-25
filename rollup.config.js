import { defineConfig } from 'rollup'
import typescript from '@rollup/plugin-typescript'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import alias from '@rollup/plugin-alias'
import dts from 'rollup-plugin-dts'
import { getAppsFiles } from 'alemonjs'
import { readdirSync } from 'fs'

/**
 *
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
      alias({
        entries: [
          {
            find: '@',
            replacement: resolve(dirname(fileURLToPath(import.meta.url)), 'src')
          }
        ]
      }),
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
const config = [
  'alemonjs',
  'discord',
  'qq',
  'kook',
  'qq-group-bot',
  'qq-guild-bot',
  'readline'
].map(name => {
  const input = `packages/${name}/src/index.ts`
  const dir = `packages/${name}/lib`
  const inc = `packages/${name}/src/**/*`
  return [buildJs(input, dir, inc), buildDts(input, dir, inc)]
})

/**
 * 得到指定目录下的所有ts&js&jsx&tsx文件
 * @param {*} dir
 * @returns
 */
const getFiles = dir => {
  let results = []
  const list = readdirSync(dir, { withFileTypes: true })
  list.forEach(item => {
    const fullPath = join(dir, item.name)
    if (item.isDirectory()) {
      results = results.concat(getAppsFiles(fullPath))
    } else if (item.isFile()) {
      if (
        item.name.endsWith('.ts') ||
        item.name.endsWith('.js') ||
        item.name.endsWith('.jsx') ||
        item.name.endsWith('.tsx')
      ) {
        results.push(fullPath)
      }
    }
  })
  return results
}

/**
 *
 * @param {*} input
 * @param {*} output
 */
const build = (input, output) => {
  // Get all files from src folder
  const inputFiles = getFiles(join(process.cwd(), input))
  config.push(buildJs(inputFiles, output, `${input}/**/*`))
  config.push(buildDts(inputFiles, output, `${input}/**/*`))
}

build('src', 'lib')

//
export default defineConfig(config.flat(Infinity))
