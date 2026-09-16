// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
/**
 * `__ac_signature` / `__ac_nonce` 配对（www.douyin.com 等站点 Cookie）。
 * 源自参考实现 douyi.js：getAcSignature（秒级、前缀 00f01）、get__ac_signature（毫秒、前缀 00101）。
 */

export const AC_SIGNATURE_HEAD_SEC = '_02B4Z6wo00f01';
export const AC_SIGNATURE_HEAD_MS = '_02B4Z6wo00101';
export const AC_SIGNATURE_LEN = 47;

function initNumCalc(calcStr: string, startVal = 0): number {
  let v = startVal;

  for (let i = 0; i < calcStr.length; i++) {
    v = ((v ^ calcStr.charCodeAt(i)) * 65599) >>> 0;
  }

  return v;
}

function getAsciiCode(num: number): number {
  if (num < 26) {
    return num + 65;
  }
  if (num < 52) {
    return num + 71;
  }
  if (num < 62) {
    return num - 4;
  }

  return num - 17;
}

function convertToStr(num: number): string {
  let str = '';

  for (const shift of [24, 18, 12, 6, 0]) {
    str += String.fromCharCode(getAsciiCode((num >> shift) & 63));
  }

  return str;
}

function checksumTail(signatureWithoutTail: string): string {
  let lastNum = 0;

  for (const ch of signatureWithoutTail) {
    lastNum = (lastNum * 65599 + ch.charCodeAt(0)) >>> 0;
  }

  return lastNum.toString(16).slice(-2);
}

export interface AcSignatureOptions {
  /** 参与 hash 的路径或站点标识，常见 `/`、`/jingxuan`、`__ac_blank` */
  url: string;
  acNonce: string;
  userAgent: string;
  /** Unix 秒；默认 `Math.floor(Date.now() / 1000)` */
  timestampSec?: number;
}

/** 秒级 `__ac_signature`（前缀 `_02B4Z6wo00f01`，长度 47） */
export function generateAcSignature(options: AcSignatureOptions): string {
  const { url, acNonce, userAgent } = options;
  const nowSec = options.timestampSec ?? Math.floor(Date.now() / 1000);
  const nowTime = String(nowSec);

  let acSignature = AC_SIGNATURE_HEAD_SEC;
  const timeNum = initNumCalc(nowTime);
  const urlNum = initNumCalc(url, timeNum);
  let binaryNum = ((Number(nowTime) ^ ((urlNum % 65521) * 65521)) >>> 0).toString(2);

  binaryNum = binaryNum.padStart(32, '0');
  binaryNum = `10000000110000${binaryNum}`;
  const decNum = parseInt(binaryNum, 2);

  acSignature += convertToStr(decNum >> 2);
  acSignature += convertToStr((decNum << 28) | 515);
  acSignature += convertToStr(-1073741824 | ((1219955485 ^ decNum) >>> 6));
  acSignature += String.fromCharCode(getAsciiCode((1219955485 ^ decNum) & 63));

  const decInitNum = initNumCalc(String(decNum));
  const nonceNum = initNumCalc(acNonce, decInitNum);
  const uaNum = initNumCalc(userAgent, decInitNum);

  acSignature += convertToStr(((uaNum % 65521 << 16) | nonceNum % 65521) >> 2);
  acSignature += convertToStr((((uaNum % 65521 << 16) ^ nonceNum % 65521) << 28) | ((524576 ^ decNum) >>> 4));
  acSignature += convertToStr(urlNum % 65521);
  acSignature += checksumTail(acSignature);

  return acSignature;
}

export interface AcSignatureMsOptions {
  url: string;
  acNonce: string;
  userAgent: string;
  /** Unix 毫秒；默认 `Date.now()` */
  timestampMs?: number;
}

/** 毫秒级变体（前缀 `_02B4Z6wo00101`） */
export function generateAcSignatureMs(options: AcSignatureMsOptions): string {
  const { url, acNonce, userAgent } = options;
  const oneTimeStamp = options.timestampMs ?? Date.now();
  const timeStampS = String(oneTimeStamp);

  const calOneStr = (oneStr: string, orgiIv: number): number => {
    let k = orgiIv;

    for (let i = 0; i < oneStr.length; i++) {
      k = ((k ^ oneStr.charCodeAt(i)) * 65599) >>> 0;
    }

    return k;
  };

  const calOneStr3 = (oneStr: string, orgiIv: number): number => {
    let k = orgiIv;

    for (let i = 0; i < oneStr.length; i++) {
      k = (k * 65599 + oneStr.charCodeAt(i)) >>> 0;
    }

    return k;
  };

  const encNumToStr = (oneOrgiEnc: number): string => {
    let s = '';

    for (let i = 24; i >= 0; i -= 6) {
      s += String.fromCharCode(getAsciiCode((oneOrgiEnc >> i) & 63));
    }

    return s;
  };

  const a = calOneStr(url, calOneStr(timeStampS, 0)) % 65521;
  const b = parseInt(
    `10000000110000${parseInt(String((oneTimeStamp ^ (a * 65521)) >>> 0), 10)
      .toString(2)
      .padStart(32, '0')}`,
    2
  );
  const bS = String(b);
  const c = calOneStr(bS, 0);
  const d = encNumToStr(b >> 2);
  const e = (b / 4294967296) >>> 0;
  const f = encNumToStr((b << 28) | (e >>> 4));
  const g = 582085784 ^ b;
  const h = encNumToStr((e << 26) | (g >>> 6));
  const i = String.fromCharCode(getAsciiCode(g & 63));
  const j = (calOneStr(userAgent, c) % 65521 << 16) | calOneStr(acNonce, c) % 65521;
  const k = encNumToStr(j >> 2);
  const l = encNumToStr((j << 28) | ((524576 ^ b) >>> 4));
  const m = encNumToStr(a);
  const n = AC_SIGNATURE_HEAD_MS + d + f + h + i + k + l + m;
  const o = parseInt(String(calOneStr3(n, 0)), 10)
    .toString(16)
    .slice(-2);

  return n + o;
}
