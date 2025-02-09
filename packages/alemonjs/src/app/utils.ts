import crypto from 'crypto'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

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
