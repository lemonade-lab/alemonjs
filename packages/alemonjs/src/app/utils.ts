import crypto from 'crypto'
/**
 * 将字符串转为定长字符串
 * @param str 输入字符串
 * @param options 可选项
 * @returns 固定长度的哈希值
 */
export function createHash(str: string, options: { length?: number; algorithm?: string } = {}) {
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
export function useUserHashKey(event: { UserId: string; Platform: string }) {
  return createHash(`${event.Platform}:${event.UserId}`)
}
