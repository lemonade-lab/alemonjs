/**
 * 将字符串转为定长字符串
 * @param str
 * @returns
 */
export function createHash(
  str: string,
  options?: {
    length?: number
    size?: number
  }
) {
  const { length = 11, size = 32 } = options ?? {}
  let hash = 5381
  let i = str.length
  while (i) {
    hash = (hash * size) ^ str.charCodeAt(--i)
  }
  // 将哈希值转换为十六进制并截取指定长度
  return Math.abs(hash).toString(16).slice(0, length)
}
