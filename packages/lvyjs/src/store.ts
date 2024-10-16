import { existsSync } from 'fs'
import { join } from 'path'
import { RollupOptions } from 'rollup'

export type Options = {
  plugins?: {
    // 应用名
    name: string
    /**
     * ⚠️直接optoins进行调整
     * @param options
     * @returns
     */
    config?: (options: Options) => Options
    /**
     * 执行
     */
    callback?: () => void
  }[]
  build?: {
    plugins?: {
      belong: 'rollup' | 'esbuild' | 'other'
      name: string
      load: any
    }[]
    // ⚠️直接覆盖build配置
    rollupOptions?: {
      input?: string | string[]
    } & RollupOptions
  }
}

/**
 *
 * @param options
 * @returns
 */
export const pluginConfig = (options: {
  // 应用名
  name: string
  /**
   * ⚠️直接optoins进行调整
   * @param options
   * @returns
   */
  config: (options: Options) => Options
  /**
   * 执行
   */
  callback?: () => void
}) => options

/**
 *
 */
declare global {
  var lvyConfig: Options
}

/**
 *
 */
export const initConfig = async () => {
  if (!global.lvyConfig) {
    // init
    global.lvyConfig = {}
  }
  const files = [
    'lvy.config.ts',
    'lvy.config.js',
    'lvy.config.mjs',
    'lvy.config.cjs',
    'lvy.config.tsx'
  ]
  let configDir = ''
  for (const file of files) {
    if (existsSync(file)) {
      configDir = file
      break
    }
  }
  if (configDir !== '') {
    const v = await import(`file://${join(process.cwd(), configDir)}`)
    if (v?.default) {
      global.lvyConfig = v.default
    }
  }
}

/**
 * @returns
 */
export const getOptions = () => {
  return global.lvyConfig
}

/**
 * @param param0
 * @returns
 */
export const defineConfig = (optoins?: Options) => optoins
