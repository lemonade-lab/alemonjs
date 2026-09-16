// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
/**
 * 精简 CookieJar：不区分 domain/path，整站共享一份键值对。
 * 语义与参考实现 douyin-im http/cookie-jar.ts 等价。
 */
export class CookieJar {
  private readonly store = new Map<string, string>();

  constructor(initial?: string) {
    if (initial) {
      this.merge(initial);
    }
  }

  get(name: string): string | undefined {
    return this.store.get(name);
  }

  has(name: string): boolean {
    return this.store.has(name);
  }

  set(name: string, value: string): void {
    this.store.set(name, value);
  }

  delete(name: string): void {
    this.store.delete(name);
  }

  /** 导入 Cookie 请求头格式；响应 Set-Cookie 用 mergeSetCookie 以支持删除 */
  merge(raw: string): void {
    const parts = raw
      .split(/[;\n]/)
      .map(p => p.trim())
      .filter(Boolean);

    for (const part of parts) {
      const eq = part.indexOf('=');

      if (eq <= 0) {
        continue;
      }
      const name = part.slice(0, eq).trim();
      const value = part.slice(eq + 1).trim();

      if (
        !name ||
        name.toLowerCase() === 'path' ||
        name.toLowerCase() === 'domain' ||
        name.toLowerCase() === 'expires' ||
        name.toLowerCase() === 'max-age' ||
        name.toLowerCase() === 'secure' ||
        name.toLowerCase() === 'httponly' ||
        name.toLowerCase() === 'samesite'
      ) {
        continue;
      }
      this.store.set(name, value);
    }
  }

  toHeader(): string {
    return [...this.store.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  /** 接受独立或合并的 Set-Cookie 字段（容忍 Expires 中的逗号），max-age<=0 或已过期则删除 */
  mergeSetCookie(raw: string, now = Date.now()): void {
    for (const line of raw.split(/,(?=\s*[^\s;,=]+\s*=)/)) {
      const [pair, ...attributes] = line.split(';');
      const eq = pair?.indexOf('=') ?? -1;

      if (!pair || eq <= 0) {
        continue;
      }
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      let maxAge: number | undefined;
      let expires: number | undefined;

      for (const attribute of attributes) {
        const separator = attribute.indexOf('=');

        if (separator < 0) {
          continue;
        }
        const key = attribute.slice(0, separator).trim().toLowerCase();
        const val = attribute.slice(separator + 1).trim();

        if (key === 'max-age' && /^-?\d+$/.test(val)) {
          maxAge = Number(val);
        }
        if (key === 'expires') {
          expires = Date.parse(val);
        }
      }
      const deleted = maxAge !== undefined ? maxAge <= 0 : expires !== undefined && expires <= now;

      if (deleted) {
        this.store.delete(name);
      } else {
        this.store.set(name, value);
      }
    }
  }
}
