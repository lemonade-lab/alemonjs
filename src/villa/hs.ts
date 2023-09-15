import { createSecretKey, createHmac } from 'crypto'
/**
 * 加密
 * @param pubKey
 * @param botSecret
 * @returns
 */
export function hmacSha256(pubKey: string, botSecret: string): string {
  try {
    const signingKey = createSecretKey(Buffer.from(pubKey, 'utf-8'))
    const mac = createHmac('sha256', signingKey)
    mac.update(botSecret, 'utf-8')
    const rawHmac = mac.digest()
    return Buffer.from(rawHmac).toString('hex')
  } catch (e) {
    throw new Error(e)
  }
}
