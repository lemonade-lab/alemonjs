import { ESBuild } from './esbuild'

type LoaderResult = {
  format?: string // 例如，模块格式
  source?: string // 模块源码
  shortCircuit?: boolean
}

const platform = ['linux', 'android', 'darwin']
const T = platform.includes(process.platform)
const reg = T ? /^file:\/\// : /^file:\/\/\//
const nodeReg = /(node_modules|node_|node:)/
const jsReg = /\.(js|ts|jsx|tsx)$/

/**
 *
 * @param url
 * @param context
 * @param defaultLoad
 * @returns
 */
export const load = async (
  url: string,
  context: any,
  defaultLoad: (url: string, context: any) => Promise<LoaderResult>
) => {
  if (nodeReg.test(url)) {
    return defaultLoad(url, context)
  }
  if (!jsReg.test(url)) {
    return defaultLoad(url, context)
  }
  const code = await ESBuild(url.replace(reg, ''))
  return {
    format: 'module',
    source: code,
    shortCircuit: true
  }
}
