import { ESBuild } from './esbuild'

type LoaderResult = {
  format?: string // 例如，模块格式
  source?: string // 模块源码
  shortCircuit?: boolean
}

const platform = ['linux', 'android', 'darwin']
const T = platform.includes(process.platform)
const reg = T ? /^file:\/\// : /^file:\/\/\//

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
  if (/(node_modules|node_)/.test(url)) {
    return defaultLoad(url, context)
  }
  // 处理所有js文件
  if (/\.(js|ts|jsx|tsx)$/.test(url)) {
    const code = await ESBuild(url.replace(reg, ''))
    return {
      format: 'module',
      source: code,
      shortCircuit: true
    }
  }
  return defaultLoad(url, context)
}
