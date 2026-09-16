// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
/**
 * `account_sdk_source_info`：对 JSON 字符串逐字节 XOR 5，再按 JS `toString(16)` 无补零拼成 hex。
 */

export function encodeAccountSdkSourceInfo(plain: string): string {
  let out = '';

  for (const ch of plain) {
    out += ((ch.codePointAt(0) ?? 0) ^ 5).toString(16);
  }

  return out;
}

export function decodeAccountSdkSourceInfo(encoded: string): string {
  const chars: string[] = [];
  let i = 0;

  while (i < encoded.length) {
    if (i + 2 <= encoded.length) {
      try {
        const b = Number.parseInt(encoded.slice(i, i + 2), 16);

        chars.push(String.fromCodePoint(b ^ 5));
        i += 2;
        continue;
      } catch {
        /* fall through */
      }
    }
    const b = Number.parseInt(encoded.slice(i, i + 1), 16);

    chars.push(String.fromCodePoint(b ^ 5));
    i += 1;
  }

  return chars.join('');
}
