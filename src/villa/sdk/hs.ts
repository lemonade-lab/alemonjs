import { createSecretKey, createHmac } from 'crypto'
/**
 * 加密
 * @param secret 原钥
 * @param pubKey 公钥
 * @returns
 */
export function hmacSha256(secret: string, pubKey: string): string {
  try {
    const signingKey = createSecretKey(Buffer.from(pubKey, 'utf-8'))
    const mac = createHmac('sha256', signingKey)
    mac.update(secret, 'utf-8')
    const rawHmac = mac.digest()
    return Buffer.from(rawHmac).toString('hex')
  } catch (e) {
    console.error('加密错误')
    throw new Error(e)
  }
}
