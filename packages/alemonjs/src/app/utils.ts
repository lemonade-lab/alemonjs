import crypto from 'crypto'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { readdirSync, Dirent, existsSync } from 'fs'
import { join } from 'path'

/**
 * 将字符串转为定长字符串
 * @param str 输入字符串
 * @param options 可选项
 * @returns 固定长度的哈希值
 */
export const createHash = (str: string, options: { length?: number; algorithm?: string } = {}) => {
  const { length = 11, algorithm = 'sha256' } = options
  // 使用 crypto 生成哈希
  const hash = crypto.createHash(algorithm).update(str).digest('hex')
  // 截取指定长度
  return hash.slice(0, length)
}

/**
 * 使用用户的哈希键
 * @param e
 * @returns
 */
export const useUserHashKey = (event: { UserId: string; Platform: string }) => {
  return createHash(`${event.Platform}:${event.UserId}`)
}

/**
 * 创建app名称
 * @param url
 * @param app 模块名
 * @param select 选择事件类型,默认apps
 * @returns
 */
export const createEventName = (
  url: string,
  app: string,
  select: 'apps' | 'middleware' = 'apps'
) => {
  const __dirname = dirname(fileURLToPath(url))
  const dirs = __dirname.split('/').reverse()
  const name = dirs.slice(0, dirs.indexOf(select)).join(':')
  return `${app}:${select}:${name}`
}

/**
 * 将字符串转为数字
 * @param str
 * @returns
 */
export const stringToNumber = (str: string, size = 33) => {
  let hash = 5381
  let i = str.length
  while (i) {
    hash = (hash * size) ^ str.charCodeAt(--i)
  }
  /*JavaScript对32位签名执行逐位操作（如上面的XOR）
   *整数。由于我们希望结果始终为正，因此转换
   *通过执行无符号位移，将带符号的int转换为无符号*/
  return hash >>> 0
}

/**
 * 递归获取所有文件
 * @param dir
 * @param condition
 * @returns
 */
export const getRecursiveDirFiles = (
  dir: string,
  condition: (func: Dirent) => boolean = item => /^res(\.|\..*\.)(js|ts|jsx|tsx)$/.test(item.name)
): {
  path: string
  name: string
}[] => {
  //
  let results: {
    path: string
    name: string
  }[] = []
  if (!existsSync(dir)) return results
  const list = readdirSync(dir, { withFileTypes: true })
  list.forEach(item => {
    const fullPath = join(dir, item.name)
    if (item.isDirectory()) {
      results = results.concat(getRecursiveDirFiles(fullPath, condition))
    } else if (item.isFile() && condition(item)) {
      results.push({
        path: fullPath,
        name: item.name
      })
    }
  })
  return results
}

/**
 * 解析错误并提示缺失的模块
 * @param e
 * @returns
 */
export const ErrorModule = (e: Error) => {
  if (!e) return
  const moduleNotFoundRegex = /Cannot find (module|package)/
  if (moduleNotFoundRegex.test(e?.message)) {
    logger.error(e.message)
    const match = e.stack?.match(/'(.+?)'/)
    if (match) {
      const pack = match[1]
      logger.error(`缺少模块或依赖 ${pack},请安装`)
    } else {
      logger.mark('无法提取缺失的信息，请检查')
    }
  } else {
    logger.error(e?.message)
  }
}
