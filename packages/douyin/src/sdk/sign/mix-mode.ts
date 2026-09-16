// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
/**
 * Passport `mix_mode=1`：明文 UTF-8 逐字节 XOR 0x05，两位小写 hex 拼接。
 */
export function mixModeEncode(plain: string): string {
  const bytes = Buffer.from(plain, 'utf8');
  let out = '';

  for (let i = 0; i < bytes.length; i++) {
    out += (bytes[i] ^ 5).toString(16).padStart(2, '0');
  }

  return out;
}

/** 创作者抓包形态：`+86 ` + 11 位手机号（含空格） */
export function mixModeEncodeMobile(mobileDigits: string, countryCode = '86'): string {
  const digits = mobileDigits.replace(/\D/g, '');

  return mixModeEncode(`+${countryCode} ${digits}`);
}

/** `send_code` 默认短信类型明文 `24` */
export const SEND_CODE_TYPE_PLAIN = '24';

export function mixModeEncodeSendCodeType(typePlain: string = SEND_CODE_TYPE_PLAIN): string {
  return mixModeEncode(typePlain);
}
