import { ed25519 } from '@noble/curves/ed25519';
export class WebhookAPI {
  config: {
    secret: string;
  };
  constructor(config: { secret: string }) {
    this.config = config;
  }
  /**
   *  验证签名
   * @param ts
   * @param body
   * @param sign
   * @returns
   */
  validSign(ts: unknown, body: unknown, sign: unknown): boolean {
    if (typeof ts !== 'string' || !ts || (typeof body !== 'string' && !Buffer.isBuffer(body))) {
      return false;
    }
    if (!Buffer.isBuffer(sign) && (typeof sign !== 'string' || !/^[a-f\d]{128}$/i.test(sign))) {
      return false;
    }
    try {
      const { publicKey } = this.getKey();
      const sig = Buffer.isBuffer(sign) ? sign : Buffer.from(sign, 'hex');
      const msg = Buffer.concat([Buffer.from(ts), Buffer.isBuffer(body) ? body : Buffer.from(body)]);

      return ed25519.verify(sig, msg, publicKey);
    } catch {
      return false;
    }
  }

  /**
   *   生成签名
   * @param eventTs
   * @param plainToken
   * @returns
   */
  getSign(eventTs, plainToken) {
    const { privateKey } = this.getKey();
    const msg = Buffer.from(eventTs + plainToken);
    const signature = Buffer.from(ed25519.sign(msg, privateKey)).toString('hex');

    return signature;
  }
  /**
   * 获取 key
   * @returns
   */
  getKey() {
    let seed = this.config.secret;

    if (!seed) {
      throw new Error("secret not set, can't calc ed25519 key");
    }
    while (seed.length < 32) {
      seed = seed.repeat(2);
    } // Ed25519 的种子大小是 32 字节
    seed = seed.slice(0, 32); // 修剪到 32 字节
    const privateKey = Buffer.from(seed);

    return {
      privateKey,
      publicKey: ed25519.getPublicKey(privateKey)
    };
  }
}
