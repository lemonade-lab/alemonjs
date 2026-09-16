// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { DESKTOP_PC_UA, desktopFingerprintParams } from './transport.js';
import { sniffImageFormat, type ImageFormat } from './media.js';
import type { ImageAsset } from './content.js';
import type { DouyinHttp } from '../http/client.js';

const UPLOAD_CONFIG_URL = 'https://www.douyin.com/aweme/v1/web/im/upload/config/v2';
const VOD_URL = 'https://vod.bytedanceapi.com/';
const VOD_REGION = 'cn-north-1';
const VOD_SERVICE = 'vod';
const VIDEO_PART_SIZE = 5 * 1024 * 1024;

export interface UploadCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  spaceName: string;
}

export interface VideoAsset {
  tkey: string;
  skey: string;
  md5: string;
}

export interface VodSignature {
  authorization: string;
  headers: Record<string, string>;
  canonicalQuery: string;
}

interface UploadAddress {
  storeUri: string;
  authorization: string;
  host: string;
  sessionKey: string;
  /** object（文件）上传的额外节点头 */
  uploadHeaders?: Record<string, string>;
  /** object 上传 GCM 加密参数（服务端加密模式） */
  gcmMode?: string;
  encryptionKey?: string;
}

export interface FileUploadAsset {
  uri: string;
  skey: string;
  md5: string;
  name: string;
  dataSize: number;
}

interface UploadProcessFunction {
  name: 'Encryption';
  input: {
    Config: Record<string, string>;
    PolicyParams: Record<string, string>;
  };
}

interface CommittedUpload {
  uri: string;
  secretKey: string;
  sourceMd5: string;
  imageSize?: number;
  imageWidth?: number;
  imageHeight?: number;
}

export function uploadProcessFunctions(fileType: 'image' | 'video' | 'object', imageFormat?: ImageFormat): UploadProcessFunction[] {
  if (fileType === 'object') {
    return [];
  }
  if (fileType === 'video') {
    return [
      {
        name: 'Encryption',
        input: {
          Config: { copies: 'cipher_v2', aes_chunk_size: '524288' },
          PolicyParams: { 'policy-set': 'medium' }
        }
      }
    ];
  }

  return [
    {
      name: 'Encryption',
      input: {
        Config: { copies: 'cipher_v2' },
        PolicyParams:
          imageFormat === 'gif' ? { 'policy-set': 'still', 'still-width': '480', 'still-height': '480' } : { 'policy-set': 'check,thumb,medium,large' }
      }
    }
  ];
}

function hashHex(data: Uint8Array | string): string {
  return createHash('sha256').update(data).digest('hex');
}

function hmac(key: Uint8Array | string, value: string): Buffer {
  return createHmac('sha256', key).update(value).digest();
}

function rfc3986(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

export function canonicalUploadQuery(query: Record<string, string>): string {
  return Object.keys(query)
    .sort()
    .map(key => `${rfc3986(key)}=${rfc3986(query[key])}`)
    .join('&');
}

/** ByteDance VOD 上传用的纯 AWS Signature V4 实现 */
export function signVodRequest(options: {
  method: 'GET' | 'POST';
  query: Record<string, string>;
  body?: Uint8Array;
  credentials: UploadCredentials;
  date: Date;
}): VodSignature {
  const canonicalQuery = canonicalUploadQuery(options.query);
  const amzDate = options.date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = hashHex(options.body ?? new Uint8Array());
  const headers: Record<string, string> = {
    'x-amz-date': amzDate,
    'x-amz-security-token': options.credentials.sessionToken
  };

  if (options.method === 'POST') {
    headers['x-amz-content-sha256'] = payloadHash;
  }
  const headerNames = Object.keys(headers).sort();
  const canonicalHeaders = headerNames.map(name => `${name}:${headers[name]}\n`).join('');
  const signedHeaders = headerNames.join(';');
  const canonicalRequest = [options.method, '/', canonicalQuery, canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const scope = `${dateStamp}/${VOD_REGION}/${VOD_SERVICE}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${hashHex(canonicalRequest)}`;
  let signingKey = hmac(`AWS4${options.credentials.secretAccessKey}`, dateStamp);

  signingKey = hmac(signingKey, VOD_REGION);
  signingKey = hmac(signingKey, VOD_SERVICE);
  signingKey = hmac(signingKey, 'aws4_request');
  const signature = hmac(signingKey, stringToSign).toString('hex');

  return {
    canonicalQuery,
    headers,
    authorization: `AWS4-HMAC-SHA256 Credential=${options.credentials.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
  };
}

let crcTable: Uint32Array | undefined;

function table(): Uint32Array {
  if (crcTable) {
    return crcTable;
  }
  crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;

    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c >>> 0;
  }

  return crcTable;
}

export function crc32Hex(data: Uint8Array): string {
  let crc = 0xffffffff;
  const values = table();

  for (const byte of data) {
    crc = values[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, '0');
}

function randomId(length: number): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';

  return [...randomBytes(length)].map(byte => alphabet[byte % alphabet.length]).join('');
}

function imageDimensions(data: Uint8Array): { width: number; height: number } {
  const b = Buffer.from(data);

  if (b.length >= 24 && b.subarray(1, 4).toString() === 'PNG') {
    return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  }
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let pos = 2;

    while (pos + 9 < b.length) {
      if (b[pos] !== 0xff) {
        pos += 1;
        continue;
      }
      const marker = b[pos + 1];

      if (marker >= 0xc0 && marker <= 0xc3) {
        return { width: b.readUInt16BE(pos + 7), height: b.readUInt16BE(pos + 5) };
      }
      const size = b.readUInt16BE(pos + 2);

      if (size < 2) {
        break;
      }
      pos += 2 + size;
    }
  }
  if (b.length >= 10 && (b.subarray(0, 6).toString() === 'GIF87a' || b.subarray(0, 6).toString() === 'GIF89a')) {
    return { width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
  }

  return { width: 0, height: 0 };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

/** Cookie 鉴权 STS → 签名 VOD → TOS 上传工作流（HTTP 统一经 DouyinHttp） */
export class ImMediaUploader {
  constructor(private readonly http: DouyinHttp, private readonly resolveUserId: () => Promise<string>) {}

  async uploadImage(data: Uint8Array): Promise<ImageAsset> {
    if (data.length === 0) {
      throw new Error('cannot upload an empty image');
    }
    const format = sniffImageFormat(data);

    if (format === 'unknown') {
      throw new Error('unsupported image data');
    }
    const credentials = await this.credentials();
    const address = await this.apply(credentials, credentials.spaceName, 'image', data.length);

    await this.putObject(address, data);
    const committed = await this.commit(credentials, address.sessionKey, 'image', format);
    const size = imageDimensions(data);

    return {
      oid: committed.uri,
      skey: committed.secretKey,
      md5: committed.sourceMd5,
      dataSize: committed.imageSize ?? data.length,
      width: committed.imageWidth ?? size.width,
      height: committed.imageHeight ?? size.height,
      format
    };
  }

  async uploadVideo(data: Uint8Array): Promise<VideoAsset> {
    if (data.length === 0) {
      throw new Error('cannot upload an empty video');
    }
    const credentials = await this.credentials();
    const address = await this.apply(credentials, credentials.spaceName, 'video', data.length);
    const uploadId = await this.initParts(address);
    const parts: string[] = [];

    for (let offset = 0, part = 1; offset < data.length; offset += VIDEO_PART_SIZE, part += 1) {
      const chunk = data.slice(offset, Math.min(offset + VIDEO_PART_SIZE, data.length));
      const crc = crc32Hex(chunk);

      await this.transferPart(address, uploadId, part, crc, chunk);
      parts.push(`${part}:${crc}`);
    }
    await this.finishParts(address, uploadId, parts.join(','));
    const committed = await this.commit(credentials, address.sessionKey, 'video');

    return { tkey: committed.uri, skey: committed.secretKey, md5: committed.sourceMd5 };
  }

  /** 文件上传（object 通道：public_file_config + GCM 服务端加密，≤10MiB） */
  async uploadFile(data: Uint8Array, name: string): Promise<FileUploadAsset> {
    if (!name.trim() || data.length === 0 || data.length > 10 * 1024 * 1024) {
      throw new Error('file requires a name and 1 byte to 10 MiB of data');
    }
    const credentials = await this.credentials('public_file_config');
    const address = await this.apply(credentials, credentials.spaceName, 'object', data.length);

    await this.putObject(address, data);
    const committed = await this.commit(credentials, address.sessionKey, 'object', undefined, address);

    return { uri: committed.uri, skey: committed.secretKey, md5: committed.sourceMd5, name, dataSize: data.length };
  }

  private async credentials(configKey = 'public_image_config'): Promise<UploadCredentials> {
    const deviceId = await this.resolveUserId();
    const params = desktopFingerprintParams(deviceId, randomBytes(16).toString('hex'));
    const response = await this.http.requestRaw(`${UPLOAD_CONFIG_URL}?${params}`, {
      method: 'GET',
      headers: { Referer: 'https://www.douyin.com/' }
    });
    const json = asRecord(JSON.parse(response.rawText));
    const config = asRecord(json[configKey]);
    const credentials = {
      accessKeyId: String(config['access_key_id'] ?? ''),
      secretAccessKey: String(config['secret_access_key'] ?? ''),
      sessionToken: String(config['session_token'] ?? ''),
      spaceName: String(config['space_name'] ?? '')
    };

    if (!response.ok || !credentials.accessKeyId || !credentials.secretAccessKey || !credentials.spaceName) {
      throw new Error(`upload credentials unavailable (HTTP ${response.status})`);
    }

    return credentials;
  }

  private async apply(credentials: UploadCredentials, space: string, fileType: 'image' | 'video' | 'object', fileSize: number): Promise<UploadAddress> {
    const query = {
      Action: 'ApplyUploadInner',
      Version: '2020-11-19',
      SpaceName: space,
      FileType: fileType,
      IsInner: '1',
      NeedFallback: 'true',
      FileSize: String(fileSize),
      s: randomId(11),
      ...(fileType === 'object' ? { OpenGcmEnc: 'true' } : {})
    };
    const json = await this.signedVodJson('GET', query, undefined, credentials);
    const result = asRecord(json['Result']);
    const direct = asRecord(result['UploadAddress']);
    const directStores = direct['StoreInfos'] as unknown[] | undefined;
    const directHosts = direct['UploadHosts'] as unknown[] | undefined;
    const inner = asRecord(result['InnerUploadAddress']);
    const nodes = inner['UploadNodes'] as unknown[] | undefined;

    if (!nodes?.length && directStores?.length && directHosts?.length && fileType !== 'object') {
      const store = asRecord(directStores[0]);

      return {
        storeUri: String(store['StoreUri'] ?? ''),
        authorization: String(store['Auth'] ?? ''),
        host: String(directHosts[0]),
        sessionKey: String(direct['SessionKey'] ?? '')
      };
    }
    const node = asRecord(nodes?.[0]);
    const stores = node['StoreInfos'] as unknown[] | undefined;
    const store = asRecord(stores?.[0]);
    const address: UploadAddress = {
      storeUri: String(store['StoreUri'] ?? ''),
      authorization: String(store['Auth'] ?? ''),
      host: String(node['UploadHost'] ?? ''),
      sessionKey: String(node['SessionKey'] ?? ''),
      uploadHeaders: Object.fromEntries(Object.entries(asRecord(node['UploadHeader'])).map(([key, value]) => [key, String(value)]))
    };

    if (fileType === 'object') {
      address.gcmMode = String(asRecord(result['SDKParam'])['server_gcm_encryption_mode'] ?? '');
      address.encryptionKey = String(asRecord(inner['AdvanceOption'])['EncryptionKey'] ?? '');
      if (!address.gcmMode || !address.encryptionKey) {
        throw new Error('VOD apply response missing file GCM parameters');
      }
    }
    if (!address.storeUri || !address.authorization || !address.host || !address.sessionKey) {
      throw new Error('VOD apply response did not contain an upload address');
    }

    return address;
  }

  private async putObject(address: UploadAddress, data: Uint8Array): Promise<void> {
    const response = await this.http.requestRaw(`https://${address.host}/upload/v1/${address.storeUri}`, {
      method: 'POST',
      headers: {
        ...(await this.storageHeaders(address.authorization, crc32Hex(data))),
        ...(address.uploadHeaders ?? {}),
        ...(address.gcmMode
          ? {
              'X-Upload-Server-Gcm-Encryption-Mode': address.gcmMode,
              'X-Upload-Server-Gcm-Encryption-Key': address.encryptionKey ?? ''
            }
          : {})
      },
      body: new Uint8Array(data)
    });
    const result = asRecord(JSON.parse(response.rawText));

    if (!response.ok || Number(result['code']) !== 2000) {
      throw new Error(`TOS upload failed: ${result['message'] ?? response.status}`);
    }
  }

  private async initParts(address: UploadAddress): Promise<string> {
    const boundary = `----WebKitFormBoundary${randomId(16)}`;
    const response = await this.http.requestRaw(`https://${address.host}/upload/v1/${address.storeUri}?phase=init`, {
      method: 'POST',
      headers: { ...(await this.storageHeaders(address.authorization)), 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body: `--${boundary}--\r\n`
    });
    const result = asRecord(JSON.parse(response.rawText));
    const uploadId = String(asRecord(result['data'])['uploadid'] ?? '');

    if (!response.ok || Number(result['code']) !== 2000 || !uploadId) {
      throw new Error('TOS multipart init failed');
    }

    return uploadId;
  }

  private async transferPart(address: UploadAddress, uploadId: string, part: number, crc: string, data: Uint8Array): Promise<void> {
    const query = new URLSearchParams({ uploadid: uploadId, part_number: String(part), phase: 'transfer' });
    const response = await this.http.requestRaw(`https://${address.host}/upload/v1/${address.storeUri}?${query}`, {
      method: 'POST',
      headers: { ...(await this.storageHeaders(address.authorization, crc)), 'Content-Disposition': 'attachment; filename="undefined"' },
      body: new Uint8Array(data)
    });
    const result = asRecord(JSON.parse(response.rawText));

    if (!response.ok || Number(result['code']) !== 2000) {
      throw new Error(`TOS part ${part} failed`);
    }
  }

  private async finishParts(address: UploadAddress, uploadId: string, manifest: string): Promise<void> {
    const query = new URLSearchParams({ phase: 'finish', uploadid: uploadId });
    const response = await this.http.requestRaw(`https://${address.host}/upload/v1/${address.storeUri}?${query}`, {
      method: 'POST',
      headers: { ...(await this.storageHeaders(address.authorization)), 'Content-Type': 'text/plain;charset=UTF-8' },
      body: manifest
    });
    const result = asRecord(JSON.parse(response.rawText));

    if (!response.ok || Number(result['code']) !== 2000) {
      throw new Error('TOS multipart finish failed');
    }
  }

  private async commit(
    credentials: UploadCredentials,
    sessionKey: string,
    fileType: 'image' | 'video' | 'object',
    imageFormat?: ImageFormat,
    address?: UploadAddress
  ): Promise<CommittedUpload> {
    const body = Buffer.from(
      JSON.stringify({
        SessionKey: sessionKey,
        Functions: uploadProcessFunctions(fileType, imageFormat),
        ...(address?.gcmMode ? { EncryptionMode: address.gcmMode, EncryptionKey: address.encryptionKey } : {})
      })
    );
    const json = await this.signedVodJson(
      'POST',
      {
        Action: 'CommitUploadInner',
        Version: '2020-11-19',
        SpaceName: credentials.spaceName
      },
      body,
      credentials
    );
    const results = asRecord(json['Result'])['Results'] as unknown[] | undefined;
    const encryption = asRecord(asRecord(results?.[0])['Encryption']);
    const extra = asRecord(encryption['Extra']);
    const committed: CommittedUpload = {
      uri: String(encryption['Uri'] ?? ''),
      secretKey: String(encryption['SecretKey'] ?? ''),
      sourceMd5: String(encryption['SourceMd5'] ?? '')
    };
    const imageSize = Number(extra['img_size']);
    const imageWidth = Number(extra['img_width']);
    const imageHeight = Number(extra['img_height']);

    if (Number.isFinite(imageSize) && imageSize > 0) {
      committed.imageSize = imageSize;
    }
    if (Number.isFinite(imageWidth) && imageWidth > 0) {
      committed.imageWidth = imageWidth;
    }
    if (Number.isFinite(imageHeight) && imageHeight > 0) {
      committed.imageHeight = imageHeight;
    }
    if (!committed.uri || !committed.secretKey) {
      throw new Error('VOD commit response did not contain encryption metadata');
    }

    return committed;
  }

  private async signedVodJson(
    method: 'GET' | 'POST',
    query: Record<string, string>,
    body: Uint8Array | undefined,
    credentials: UploadCredentials
  ): Promise<Record<string, unknown>> {
    const signed = signVodRequest({ method, query, ...(body ? { body } : {}), credentials, date: new Date() });
    const response = await this.http.requestRaw(`${VOD_URL}?${signed.canonicalQuery}`, {
      method,
      headers: {
        ...signed.headers,
        Authorization: signed.authorization,
        'User-Agent': DESKTOP_PC_UA,
        ...(body ? { 'Content-Type': 'text/plain;charset=UTF-8' } : {})
      },
      ...(body ? { body: new Uint8Array(body) } : {})
    });
    const json = asRecord(JSON.parse(response.rawText));

    if (!response.ok) {
      throw new Error(`VOD ${method} failed (HTTP ${response.status})`);
    }
    const error = asRecord(asRecord(json['ResponseMetadata'])['Error']);

    if (error['Code'] || error['CodeN']) {
      throw new Error(`VOD ${query['Action']} failed: ${String(error['Code'] ?? error['CodeN'])}`);
    }

    return json;
  }

  private async storageHeaders(authorization: string, crc?: string): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      Authorization: authorization,
      'Content-Type': 'application/octet-stream',
      'X-Storage-U': await this.resolveUserId(),
      'User-Agent': DESKTOP_PC_UA
    };

    if (crc) {
      headers['Content-CRC32'] = crc;
    }

    return headers;
  }
}
