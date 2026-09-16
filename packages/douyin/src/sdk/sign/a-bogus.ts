// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
import { randomBytes } from 'node:crypto';

/**
 * Web 端 a_bogus（bdms）逆向算法，自参考实现 a_bogus.js V 1.0.1.20 逐行等价迁移。
 * 禁止改动任何常量表与位运算，否则签名失效。
 */

const TABLES = {
  s0: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
  s1: 'Dkdpgh4ZKsQB80/Mfvw36XI1R25+WUAlEi7NLboqYTOPuzmFjJnryx9HVGcaStCe=',
  s2: 'Dkdpgh4ZKsQB80/Mfvw36XI1R25-WUAlEi7NLboqYTOPuzmFjJnryx9HVGcaStCe=',
  s3: 'ckdp1h4ZKsUB80/Mfvw36XIgR25+WQAlEi7NLboqYTOPuzmFjJnryx9HVGDaStCe',
  s4: 'Dkdpgh2ZmsQB80/MfvV36XI1R45-WUAlEixNLwoqYTOPuzKFjJnry79HbGcaStCe'
} as const;

const SALT = 'dhzx';

export const BDMS_PRESETS = {
  '1.0.1.20': { constVal1: 22740, constVal2: 2631 },
  '1.0.1.16': { constVal1: 22740, constVal2: 2631 }
} as const;

export type BdmsPreset = keyof typeof BDMS_PRESETS;

/** 与 DEFAULT_USER_AGENT（Mac）匹配的屏参 */
export const MAC_SCREEN_FINGERPRINT = '1728|1117|1728|303|1728|1117|1728|982|MacIntel';

/** 参考脚本默认 Windows 指纹 */
export const WIN_SCREEN_FINGERPRINT = '1920|366|1918|1048|1920|1050|1920|1080|Win32';

export const DEFAULT_SCREEN_FINGERPRINT = MAC_SCREEN_FINGERPRINT;

export interface ABogusOptions {
  userAgent: string;
  /** 已含 sign/qs/msToken，不含 a_bogus 的 query 串 */
  query: string;
  /** POST 为 on-wire x-www-form-urlencoded；GET 传 '' */
  body?: string;
  screenFingerprint?: string;
  bdmsPreset?: BdmsPreset;
  keyVal?: number;
}

export function generateABogus(options: ABogusOptions): string {
  const preset = BDMS_PRESETS[options.bdmsPreset ?? '1.0.1.16'];
  const body = options.body ?? '';
  const fpArr = strToByteArr(options.screenFingerprint ?? DEFAULT_SCREEN_FINGERPRINT);
  const tm2 = new Date().getTime() - 1;
  const tm1Before = new Date().getTime();

  const queryArr32 = sm3Digest(sm3Digest(`${options.query}${SALT}`));
  const dataArr32 = sm3Digest(sm3Digest(`${body}${SALT}`));
  const keyVal = options.keyVal ?? 0;

  const userAgentLmStr = rc4Parse(String.fromCharCode(...[0.00390625, 1, keyVal]), options.userAgent);
  const userAgentArr32 = sm3Digest(lmStrEncode(strToByteArr(userAgentLmStr), TABLES.s3));

  const tm1 = new Date().getTime();

  const arr50: number[] = [
    41,
    9,
    6,
    (tm1 - tm1Before + 3) & 255,
    (tm1 >> 0) & 255,
    (tm1 >> 8) & 255,
    (tm1 >> 16) & 255,
    (tm1 >> 24) & 255,
    (tm1 / 256 / 256 / 256 / 256) & 255,
    (tm1 / 256 / 256 / 256 / 256 / 256) & 255,
    1 & 255,
    Math.floor(1 / 256) & 255,
    129,
    (129 >> 8) & 255,
    ((Math.random() * 200) | 0) + 50,
    ((Math.random() * 200) | 0) + 50,
    ((Math.random() * 200) | 0) + 50,
    ((Math.random() * 200) | 0) + 50,
    (keyVal >> 0) & 255,
    (keyVal >> 8) & 255,
    (keyVal >> 16) & 255,
    (keyVal >> 24) & 255,
    queryArr32[9],
    queryArr32[18],
    queryArr32[3],
    dataArr32[10],
    dataArr32[19],
    dataArr32[4],
    userAgentArr32[11],
    userAgentArr32[21],
    userAgentArr32[5],
    (tm2 >> 0) & 255,
    (tm2 >> 8) & 255,
    (tm2 >> 16) & 255,
    (tm2 >> 24) & 255,
    (tm2 / 256 / 256 / 256 / 256) & 255,
    (tm2 / 256 / 256 / 256 / 256 / 256) & 255,
    3,
    (preset.constVal1 >> 0) & 255,
    (preset.constVal1 >> 8) & 255,
    (preset.constVal1 >> 16) & 255,
    (preset.constVal1 >> 24) & 255,
    (preset.constVal2 >> 0) & 255,
    (preset.constVal2 >> 8) & 255,
    (preset.constVal2 >> 16) & 255,
    (preset.constVal2 >> 24) & 255,
    44,
    0,
    4,
    0
  ];

  const newArr50 = reorderArr50(arr50);
  const xorRandomArr8 = xorRandomArr8Gen();
  const xorArray = xorFold([...xorRandomArr8, ...arr50]);
  const arr4Merge = [...newArr50, ...fpArr, ...tmArr(tm1), ...xorArray];

  let aBogusLmStr = String.fromCharCode(...aBogusPrefix4());
  const mergeArr: number[] = [];

  for (let i = 0; i < arr4Merge.length / 3; i++) {
    const val1 = arr4Merge[3 * i];
    const val2 = arr4Merge[3 * i + 1];
    const val3 = arr4Merge[3 * i + 2];
    const randomVal = (Math.random() * 1000) & 255;

    mergeArr.push((randomVal & 145) | (val1 & 110), (randomVal & 66) | (val2 & 189), (randomVal & 44) | (val3 & 211), (val1 & 145) | (val2 & 66) | (val3 & 44));
  }
  const bigArr = [...xorRandomArr8, ...mergeArr, ...xorArray];

  aBogusLmStr += rc4Parse(String.fromCharCode(211), String.fromCharCode(...bigArr));

  return lmStrEncode(strToByteArr(aBogusLmStr), TABLES.s4);
}

export interface JumpbyteABogusOptions {
  userAgent: string;
  query: string;
  body?: string;
  nowMs?: number;
  random?: () => number;
}

/** jumpbyte-bot internal/abogus 的逐步骤移植，仅供 desktop Passport 使用 */
export function generateJumpbyteABogus(options: JumpbyteABogusOptions): string {
  const now = options.nowMs ?? Date.now();
  const random = options.random ?? cryptoRandomFloat;
  const query = `${options.query}${SALT}`;
  const body = `${options.body ?? ''}${SALT}`;
  const queryHash = sm3Digest(sm3Digest(query));
  const bodyHash = sm3Digest(sm3Digest(body));
  const uaHash = sm3Digest(lmStrEncode(jumpbyteGarble(jumpbyteUaSbox(0), encodeUtf8ForSm3(options.userAgent)), TABLES.s3));
  const fixed = encodeUtf8ForSm3('784|943|1707|1019|1707|1019|1707|1067|MacIntel');
  const dateBucket = Math.trunc((now - 1721836800000) / 1209600000);
  const firstTime = now;
  const secondTime = firstTime - Math.trunc(random() * 10);
  const prefix = jumpbyteRandomPrefix(random);
  const arr = new Array<number>(55).fill(0);

  arr[0] = 41;
  arr[1] = dateBucket;
  arr[2] = 5;
  arr[3] = (firstTime - secondTime + 3) & 255;
  for (let i = 0; i < 6; i++) {
    arr[4 + i] = byteAt(firstTime, i);
  }
  arr[10] = 1;
  arr[12] = 1;
  arr[14] = 1;
  arr[22] = queryHash[9]!;
  arr[23] = queryHash[18]!;
  arr[24] = 3;
  arr[25] = queryHash[3]!;
  arr[26] = bodyHash[10]!;
  arr[27] = bodyHash[19]!;
  arr[28] = 4;
  arr[29] = bodyHash[4]!;
  arr[30] = uaHash[11]!;
  arr[31] = uaHash[21]!;
  arr[32] = 5;
  arr[33] = uaHash[5]!;
  for (let i = 0; i < 6; i++) {
    arr[34 + i] = byteAt(secondTime, i);
  }
  arr[40] = 3;
  writeInt32LE(arr, 41, 6241);
  writeInt32LE(arr, 45, 6383);
  const lastTime = encodeUtf8ForSm3(`${(firstTime + 3) & 255},`);

  arr[49] = fixed.length;
  arr[50] = fixed.length & 255;
  arr[51] = (fixed.length >> 8) & 255;
  arr[52] = lastTime.length;
  arr[53] = lastTime.length & 255;
  arr[54] = (lastTime.length >> 8) & 255;
  const checksumIndexes = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 25, 26, 27, 29, 30, 31, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43,
    44, 45, 46, 47, 48, 50, 51, 53, 54
  ];
  let checksum = prefix.reduce((value, item) => value ^ item, 0);

  for (const index of checksumIndexes) {
    checksum ^= arr[index];
  }
  const order = [
    9, 18, 30, 35, 47, 4, 44, 19, 10, 23, 12, 40, 25, 42, 3, 22, 38, 21, 5, 45, 1, 29, 6, 43, 33, 14, 36, 37, 2, 46, 15, 48, 31, 26, 16, 13, 8, 41, 27, 17, 39,
    20, 11, 0, 34, 7, 50, 51, 53, 54
  ];
  const ordered = order.map(index => arr[index]);
  const payload = jumpbyteExpand(prefix, [...ordered, ...fixed, ...lastTime, checksum], random);
  const header = jumpbyteHeader(random);
  const encrypted = jumpbyteGarble(jumpbyteAbSbox(), payload);

  return lmStrEncode([...header, ...encrypted], TABLES.s4);
}

function jumpbyteExpand(prefix: number[], input: number[], random: () => number): number[] {
  const output = [...prefix];

  for (let i = 0; i < input.length; i += 3) {
    if (i + 2 >= input.length) {
      output.push(...input.slice(i));
      break;
    }
    const value = Math.trunc(random() * 1000) & 255;
    const first = input[i];
    const second = input[i + 1];
    const third = input[i + 2];

    output.push((value & 145) | (first & 110), (value & 66) | (second & 189), (value & 44) | (third & 211), (first & 145) | (second & 66) | (third & 44));
  }

  return output;
}

function jumpbyteHeader(random: () => number): number[] {
  const first = Math.trunc(random() * 65535) & 255;
  const second = Math.trunc(random() * 40);

  return [(first & 170) | (3 & 85), (first & 85) | (3 & 170), (second & 170) | (82 & 85), (second & 85) | (82 & 170)];
}

function jumpbyteRandomPrefix(random: () => number): number[] {
  const first = Math.trunc(random() * 65535);
  const low = first & 255;
  const high = (first >> 8) & 255;
  const second = Math.trunc(random() * 240);
  const third = (Math.trunc(random() * 255) & 77) | 2 | 16 | 32 | 128;

  return [
    (low & 170) | (1 & 85),
    (low & 85) | (1 & 170),
    (high & 170) | (0 & 85),
    (high & 85) | (0 & 170),
    (second & 170) | (1 & 85),
    (second & 85) | (1 & 170),
    (third & 170) | (0 & 85),
    (third & 85) | (0 & 170)
  ];
}

function jumpbyteAbSbox(): number[] {
  return jumpbyteSbox([211]);
}

function jumpbyteUaSbox(salt: number): number[] {
  return jumpbyteSbox([0, 1, salt]);
}

function jumpbyteSbox(key: number[]): number[] {
  const values = Array.from({ length: 256 }, (_, index) => 255 - index);
  let previous = 0;

  for (let i = 0; i < 256; i++) {
    previous = (previous * values[i] + previous + key[i % key.length]) % 256;
    [values[i], values[previous]] = [values[previous], values[i]];
  }

  return values;
}

function jumpbyteGarble(sbox: number[], input: number[]): number[] {
  let previous = 0;

  return input.map((value, index) => {
    const cursor = (index + 1) % 256;

    previous = (previous + sbox[cursor]) % 256;
    const old = sbox[cursor];

    sbox[cursor] = sbox[previous]!;
    sbox[previous] = old;

    return value ^ sbox[(sbox[cursor] + old) % 256];
  });
}

function byteAt(value: number, index: number): number {
  return Number((BigInt(Math.trunc(value)) >> BigInt(index * 8)) & 255n);
}

function writeInt32LE(target: number[], offset: number, value: number): void {
  for (let i = 0; i < 4; i++) {
    target[offset + i] = (value >> (i * 8)) & 255;
  }
}

function cryptoRandomFloat(): number {
  const value = randomBytes(8).readBigUInt64BE() >> 11n;

  return Number(value) / 0x20000000000000;
}

function lmStrEncode(bytes: number[], table: string): string {
  let out = '';
  const groupNum = bytes.length / 3;

  for (let i = 0; i < groupNum; i++) {
    const b1 = bytes[3 * i] & 255;
    const b2 = bytes[3 * i + 1] & 255;
    const b3 = bytes[3 * i + 2] & 255;
    const big = (b1 << 16) | (b2 << 8) | b3;

    out += table.charAt((big & 0xfc0000) >> 18);
    out += table.charAt((big & 0x3f000) >> 12);
    out += table.charAt((big & 0xfc0) >> 6);
    out += table.charAt(big & 0x3f);
  }
  const rem = bytes.length % 3;

  if (rem === 1) {
    out = out.substring(0, out.length - 2) + '==';
  } else if (rem === 2) {
    out = out.substring(0, out.length - 1) + '=';
  }

  return out;
}

function rc4Parse(key: string, data: string): string {
  const sbox = Array.from({ length: 256 }, (_, i) => 255 - i);
  let j = 0;

  for (let i = 0; i < 256; i++) {
    j = (j * sbox[i] + j + key.charCodeAt(i % key.length)) % 256;
    const tmp = sbox[i];

    sbox[i] = sbox[j]!;
    sbox[j] = tmp;
  }
  let out = '';
  let prev = 0;

  for (let i = 0; i < data.length; i++) {
    const idx = (i + 1) % 256;
    const idx2 = (prev + sbox[idx]) % 256;
    const idx3 = (sbox[idx2] + sbox[idx]) % 256;

    prev = idx2;
    const t1 = sbox[idx];

    sbox[idx] = sbox[idx2]!;
    sbox[idx2] = t1;
    out += String.fromCharCode(data.charCodeAt(i) ^ sbox[idx3]);
  }

  return out;
}

function strToByteArr(s: string): number[] {
  return Array.from(s, c => c.charCodeAt(0));
}

function tmArr(tm: number): number[] {
  const tmNum = (tm + 3) & 255;
  const tmStr = `${tmNum},`;

  return strToByteArr(tmStr);
}

function aBogusPrefix4(): number[] {
  const r1 = (Math.random() * 65535) & 255;
  const r2 = Math.random() * 40;

  return [(r1 & 170) | 1, (r1 & 85) | 2, ((r2 >> 0) & 170) | 80, ((r2 >> 0) & 85) | 2];
}

function xorRandomArr8Gen(): number[] {
  const r1 = Math.random() * 65535;
  const t1 = r1 & 255;
  const t2 = (r1 >> 8) & 255;
  const n1 = (t1 & 170) | 1;
  const n2 = (t1 & 85) | 0;
  const n3 = (t2 & 170) | 0;
  const n4 = (t2 & 85) | 0;
  const randomVal = Math.random() * 255;
  let isEven = Math.random() * 240 + 110;

  if (isEven % 2 !== 0) {
    isEven++;
  }
  const n5 = (isEven & 170) | 1;
  const n6 = (isEven & 85) | 0;
  const n7 = ((((randomVal >> 0) & 77) | 2 | 16 | 32 | 128) & 170) | 16;
  const n8 = ((((randomVal >> 0) & 77) | 16 | 32 | 128) & 85) | 2;

  return [n1, n2, n3, n4, n5, n6, n7, n8];
}

function reorderArr50(arr50: number[]): number[] {
  const o = new Array<number>(50);

  o[0] = arr50[9]!;
  o[1] = arr50[18]!;
  o[2] = arr50[28]!;
  o[3] = arr50[32]!;
  o[4] = arr50[11]!;
  o[5] = arr50[4]!;
  o[6] = arr50[11]!;
  o[7] = arr50[11]!;
  o[8] = arr50[9]!;
  o[9] = arr50[23]!;
  o[10] = arr50[12]!;
  o[11] = arr50[37]!;
  o[12] = arr50[24]!;
  o[13] = arr50[39]!;
  o[14] = arr50[3]!;
  o[15] = arr50[22]!;
  o[16] = arr50[35]!;
  o[17] = arr50[11]!;
  o[18] = arr50[5]!;
  o[19] = arr50[42]!;
  o[20] = arr50[1]!;
  o[21] = arr50[27]!;
  o[22] = arr50[33]!;
  o[23] = arr50[11]!;
  o[24] = arr50[30]!;
  o[25] = arr50[14]!;
  o[26] = arr50[6]!;
  o[27] = arr50[7]!;
  o[28] = arr50[2]!;
  o[29] = arr50[43]!;
  o[30] = arr50[15]!;
  o[31] = arr50[11]!;
  o[32] = arr50[29]!;
  o[33] = arr50[25]!;
  o[34] = arr50[16]!;
  o[35] = arr50[11]!;
  o[36] = arr50[8]!;
  o[37] = arr50[38]!;
  o[38] = arr50[26]!;
  o[39] = arr50[17]!;
  o[40] = arr50[9]!;
  o[41] = arr50[11]!;
  o[42] = arr50[11]!;
  o[43] = arr50[0]!;
  o[44] = arr50[31]!;
  o[45] = arr50[7]!;
  o[46] = arr50[46]!;
  o[47] = arr50[47]!;
  o[48] = arr50[48]!;
  o[49] = arr50[49]!;

  return o;
}

function xorFold(arr: number[]): number[] {
  let x = 0;

  for (const v of arr) {
    x ^= v;
  }

  return [x];
}

function sm3Digest(data: string | number[]): number[] {
  const bytes = typeof data === 'string' ? encodeUtf8ForSm3(data) : data;
  const h = new Sm3();

  return h.sum(bytes);
}

function encodeUtf8ForSm3(text: string): number[] {
  const encoded = encodeURIComponent(text).replace(/%([0-9A-F]{2})/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));

  return Array.from(encoded, c => c.charCodeAt(0));
}

class Sm3 {
  private reg: number[] = [];
  private chunk: number[] = [];
  private size = 0;

  reset(): void {
    this.reg = [1937774191, 1226093241, 388252375, 3666478592, 2842636476, 372324522, 3817729613, 2969243214];
    this.chunk = [];
    this.size = 0;
  }

  write(data: number[]): void {
    this.size += data.length;
    let r = 64 - this.chunk.length;

    if (data.length < r) {
      this.chunk = this.chunk.concat(data);

      return;
    }
    this.chunk = this.chunk.concat(data.slice(0, r));
    while (this.chunk.length >= 64) {
      this.compressBlock(this.chunk);
      if (r < data.length) {
        this.chunk = data.slice(r, Math.min(r + 64, data.length));
      } else {
        this.chunk = [];
      }
      r += 64;
    }
  }

  sum(data: number[]): number[] {
    this.reset();
    if (data.length) {
      this.write(data);
    }
    this.fill();
    for (let i = 0; i < this.chunk.length; i += 64) {
      this.compressBlock(this.chunk.slice(i, i + 64));
    }
    const out = new Array<number>(32);

    for (let i = 0; i < 8; i++) {
      let c = this.reg[i];

      out[4 * i + 3] = c & 255;
      c >>>= 8;
      out[4 * i + 2] = c & 255;
      c >>>= 8;
      out[4 * i + 1] = c & 255;
      c >>>= 8;
      out[4 * i] = c & 255;
    }
    this.reset();

    return out;
  }

  private fill(): void {
    const bitLen = 8 * this.size;
    let e = this.chunk.push(128) % 64;

    for (; 64 - e < 8; e -= 64) {
      /* align */
    }
    for (; e < 56; e++) {
      this.chunk.push(0);
    }
    for (let i = 0; i < 4; i++) {
      const n = Math.floor(bitLen / 0x100000000);

      this.chunk.push((n >>> (8 * (3 - i))) & 255);
    }
    for (let i = 0; i < 4; i++) {
      this.chunk.push((bitLen >>> (8 * (3 - i))) & 255);
    }
  }

  private compressBlock(block: number[]): void {
    const w = expand(block);
    const r = this.reg.slice();

    for (let j = 0; j < 64; j++) {
      let o = rotl(r[0], 12) + r[4] + rotl(tj(j), j);

      o = rotl((o & 0xffffffff) >>> 0, 7);
      const i = ((o ^ rotl(r[0], 12)) & 0xffffffff) >>> 0;
      let u = (ff(j, r[0], r[1], r[2]) + r[3] + i + w[j + 68]) & 0xffffffff;

      u >>>= 0;
      let c = (gg(j, r[4], r[5], r[6]) + r[7] + o + w[j]) & 0xffffffff;

      c >>>= 0;
      r[3] = r[2]!;
      r[2] = rotl(r[1], 9);
      r[1] = r[0]!;
      r[0] = u;
      r[7] = r[6]!;
      r[6] = rotl(r[5], 19);
      r[5] = r[4]!;
      r[4] = (c ^ rotl(c, 9) ^ rotl(c, 17)) >>> 0;
    }
    for (let a = 0; a < 8; a++) {
      this.reg[a] = (this.reg[a] ^ r[a]) >>> 0;
    }
  }
}

function rotl(x: number, n: number): number {
  n %= 32;

  return ((x << n) | (x >>> (32 - n))) >>> 0;
}

/** 与参考 a_bogus.js / bdms 内嵌 SM3 一致（非国标 Tj 低段常量） */
function tj(j: number): number {
  return j < 16 ? 2043430169 : 2055708042;
}

function ff(j: number, a: number, b: number, c: number): number {
  return j < 16 ? (a ^ b ^ c) >>> 0 : ((a & b) | (a & c) | (b & c)) >>> 0;
}

function gg(j: number, a: number, b: number, c: number): number {
  return j < 16 ? (a ^ b ^ c) >>> 0 : ((a & b) | (~a & c)) >>> 0;
}

function expand(block: number[]): number[] {
  const w = new Array<number>(132).fill(0);

  for (let i = 0; i < 16; i++) {
    w[i] = ((block[4 * i] << 24) | (block[4 * i + 1] << 16) | (block[4 * i + 2] << 8) | block[4 * i + 3]) >>> 0;
  }
  for (let i = 16; i < 68; i++) {
    let t = w[i - 16] ^ w[i - 9] ^ rotl(w[i - 3], 15);

    t = (t ^ rotl(t, 15) ^ rotl(t, 23)) >>> 0;
    w[i] = (t ^ rotl(w[i - 13], 7) ^ w[i - 6]) >>> 0;
  }
  for (let i = 0; i < 64; i++) {
    w[i + 68] = (w[i] ^ w[i + 4]) >>> 0;
  }

  return w;
}
