/**
 * 将字符串转为数字
 * @param str
 * @returns
 */
export function getHash(str: string, size = 33) {
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
