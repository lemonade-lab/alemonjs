import { dirname, basename, join } from 'path'
import { fileURLToPath } from 'url'
import { AppLoadConfig } from './configs.js'

/**
 *
 * @param url import.meta.url
 * @returns 执行路径
 */
export function getAppPath(url: string | URL) {
  return dirname(fileURLToPath(url)).replace(/\\/g, '/')
}

/**
 *
 * @param url
 * @returns
 */
export function importPath(url: string | URL) {
  // 检查 URL 参数
  if (!url || (typeof url !== 'string' && !(url instanceof URL))) {
    throw new Error('Invalid URL parameter')
  }
  return {
    name: () => {
      const dir = getAppPath(url)
      // 是否有该地址
      const PluginsDir = AppLoadConfig.get('dir')
      const index = dir.indexOf(PluginsDir)
      // 判断是否有
      if (index == -1) {
        // 不存在,以根目录为准
        const cacheDir = process.cwd().replace(/\\/g, '/')
        return basename(cacheDir)
      }
      const subDir = dir.slice(index + PluginsDir.length + 1)
      const name = subDir.indexOf('/') === -1 ? subDir : subDir.split('/')[0]
      return name
    },
    cwd: () => {
      const dir = getAppPath(url)
      // 是否有该地址
      const PluginsDir = AppLoadConfig.get('dir')
      const index = dir.indexOf(PluginsDir)
      // 判断是否有
      if (index == -1) {
        // 不存在,以根目录为准
        return process.cwd().replace(/\\/g, '/')
      }
      const NewDir = dir.substring(0, index + PluginsDir.length)
      const subDir = dir.slice(index + PluginsDir.length + 1)
      const name = subDir.indexOf('/') === -1 ? subDir : subDir.split('/')[0]
      return join(NewDir, name).replace(/\\/g, '/')
    }
  }
}
