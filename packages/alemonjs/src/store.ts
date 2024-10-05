import { existsSync } from 'fs'
import { join } from 'path'
import { RollupOptions } from 'rollup'

export type Options = {
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

declare global {
  var alemonjsconfig: Options
}

/**
 *
 */
export const initConfig = async () => {
  if (!global.alemonjsconfig) {
    // init
    global.alemonjsconfig = {}
  }
  const files = [
    'alemon.config.ts',
    'alemon.config.js',
    'alemon.config.mjs',
    'alemon.config.cjs',
    'alemon.config.tsx'
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
      global.alemonjsconfig = v.default
    }
  }
}

/**
 * @returns
 */
export const getOptions = () => {
  return global.alemonjsconfig
}

/**
 *
 * @param param0
 * @returns
 */
export const defineConfig = (optoins?: Options) => optoins
