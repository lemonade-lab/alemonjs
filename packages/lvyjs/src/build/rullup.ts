import { LoggingFunction, rollup, RollupLog } from 'rollup'
import { join } from 'path'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import styles from 'rollup-plugin-styles'
import { runRollupStylesCSSImport } from '../plugins/loader-css'
import { getFiles } from './get-files'

/**
 * 用于忽略警告
 * @param warning
 * @param warn
 */
const onwarn = (warning: RollupLog, warn: LoggingFunction) => {
  if (warning.code === 'UNRESOLVED_IMPORT') return
  warn(warning)
}

/**
 *
 * @param inputs
 * @param output
 */
const buildJs = async (inputs: string[], output: string) => {
  // 从全局变量中，拿到 rollup 的配置
  const plguins = []
  // 存在build配置
  if (global?.lvyConfig?.build) {
    const p = global.lvyConfig.build?.plugins
    if (p && Array.isArray(p)) {
      // 遍历插件
      const ps = p.filter(item => item.belong == 'rollup')
      for (const item of ps) {
        plguins.push(item.load())
      }
    }
  }
  const bundle = await rollup({
    input: inputs,
    plugins: [
      ...plguins,
      styles({
        mode: ['inject', () => '']
      }),
      runRollupStylesCSSImport(),
      commonjs(),
      json(),
      typescript()
    ],
    onwarn: onwarn
  })
  // 写入输出文件
  await bundle.write({
    dir: output,
    format: 'es',
    sourcemap: false,
    preserveModules: true
  })
}

/**
 *
 * @param script
 */
export async function buildAndRun(input: string, output: string) {
  const inputFiles = getFiles(join(process.cwd(), input))
  await buildJs(inputFiles, output)
}
