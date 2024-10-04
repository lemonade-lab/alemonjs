import { rollup } from 'rollup'
import { join } from 'path'
import { readdirSync } from 'fs'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
// import dts from 'rollup-plugin-dts'
import { rollupNodeFiles } from './loader-files'

// 尝试从参数中，得到更高优先级的配置
const argv = [...process.argv].slice(2)

/**
 * @param key 参数
 * @returns 参数值
 */
const getArgvValue = key => {
  const v = argv.indexOf(key)
  if (v === -1) return null
  const next = argv[v + 1]
  if (typeof next == 'string') {
    // 如果是参数
    if (next.startsWith('-')) return null
    // 如果是值
    return next
  }
  return null
}

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
      results.push(...getFiles(fullPath)) // 使用扩展运算符
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
const onwarn = (warning, warn) => {
  if (warning.code === 'UNRESOLVED_IMPORT') return
  warn(warning)
}

/**
 *
 * @returns
 */
const getRexs = () => {
  if (argv.includes('--esms-no-import')) {
    return []
  }
  const i = getArgvValue('--esms-image-import')
  const i_rex = i ? new RegExp(i) : /(\.png|\.jpg|\.jpeg|\.gif|\.svg|.webp)$/
  const s = getArgvValue('--esms-css-import')
  const s_rex2 = s ? new RegExp(s) : /(\.css)$/
  const v = getArgvValue('--esms-vidoe-import')
  const v_rex3 = v ? new RegExp(v) : /(\.mp4|\.webm|\.ogv)$/
  const v2 = getArgvValue('--esms-aodio-import')
  const v_rex4 = v2 ? new RegExp(v2) : /(\.mp3|\.wav|\.ogg)$/
  return [i_rex, s_rex2, v_rex3, v_rex4]
}

/**
 *
 * @param inputs
 * @param output
 */
const buildJs = async (inputs: string[], output: string) => {
  const rexs = getRexs()
  const bundle = await rollup({
    input: inputs,
    plugins: [
      ...rexs.map(rex => rollupNodeFiles({ filter: rex })),
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
  // output js
  await buildJs(inputFiles, output)
  // output d.ts
  // await buildDts(inputFiles, output)
}
