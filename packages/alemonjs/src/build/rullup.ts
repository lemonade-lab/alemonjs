import { LoggingFunction, rollup, RollupLog } from 'rollup'
import { join } from 'path'
import { readdirSync } from 'fs'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'

/**
 * 获取指定目录下的所有 ts、js、jsx、tsx 文件
 * @param dir 目录路径
 * @returns 文件路径数组
 */
const getFiles = (dir: string) => {
  const results: string[] = []
  const list = readdirSync(dir, { withFileTypes: true })
  list.forEach(item => {
    const fullPath = join(dir, item.name)
    if (item.isDirectory()) {
      results.push(...getFiles(fullPath))
    } else if (
      item.isFile() &&
      /\.(ts|js|jsx|tsx)$/.test(item.name) &&
      !item.name.endsWith('.d.ts')
    ) {
      results.push(fullPath)
    }
  })
  return results
}

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
  if (global?.alemonjsconfig?.build) {
    const p = global.alemonjsconfig.build?.plugins
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
    plugins: [...plguins, commonjs(), json(), typescript()],
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
