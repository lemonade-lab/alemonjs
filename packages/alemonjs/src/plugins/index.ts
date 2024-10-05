import aliasx, { RollupAliasOptions } from '@rollup/plugin-alias'
import { rollupNodeFiles } from './loader-files'

/**
 * ruleup别名插件
 * @param options
 * @returns
 */
export const alias = (options?: RollupAliasOptions) => {
  return {
    belong: 'rollup' as 'rollup' | 'esbuild' | 'other',
    name: 'alias',
    load: () => aliasx(options)
  }
}

/**
 * ruleup插件：对指定类型文件进行字符串引用处理
 * @param options
 * @returns
 */
export const files = (options: { filter: RegExp }) => {
  return {
    belong: 'rollup' as 'rollup' | 'esbuild' | 'other',
    name: 'import-files',
    load: () => rollupNodeFiles(options)
  }
}
