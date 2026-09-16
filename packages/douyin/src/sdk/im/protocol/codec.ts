// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
import { loadRoot } from './proto.js';

const SDK_VERSION = '0.7.2-fix.1';
const BUILD_NUMBER = '2f4951d:fix/douyin-creator-fix';

export interface EncodeRequestOptions {
  token: string;
  cmd: number;
  inboxType?: number;
  body?: Record<string, unknown>;
  sequenceId?: number;
  authType?: number;
  /** device_id（浏览器发消息为空字符串） */
  deviceId?: string;
  /** 覆盖 device_platform */
  devicePlatform?: string;
  /** 覆盖 headers */
  headers?: Record<string, string>;
  sdkVersion?: string;
  buildNumber?: string;
  refer?: number;
  versionCode?: string;
  biz?: string;
  access?: string;
}

export interface DecodedResponse {
  cmd: number;
  sequenceId: number;
  statusCode: number;
  errorDesc: string;
  inboxType: number;
  body: Record<string, unknown> | null;
  logId: string;
}

let sequenceCounter = 0;

export async function encodeRequest(opts: EncodeRequestOptions): Promise<Uint8Array> {
  const root = await loadRoot();
  const RequestEnvelope = root.lookupType('im.RequestEnvelope');

  sequenceCounter += 1;
  const envelope: Record<string, unknown> = {
    cmd: opts.cmd,
    sequenceId: opts.sequenceId ?? sequenceCounter,
    sdkVersion: opts.sdkVersion ?? SDK_VERSION,
    token: opts.token,
    refer: opts.refer ?? 3,
    inboxType: opts.inboxType ?? 1,
    buildNumber: opts.buildNumber ?? BUILD_NUMBER,
    deviceId: opts.deviceId ?? '',
    devicePlatform: opts.devicePlatform ?? 'douyin_pc',
    versionCode: opts.versionCode ?? '',
    headers: opts.headers ?? {},
    authType: opts.authType ?? 3,
    biz: opts.biz ?? 'douyin_creator',
    access: opts.access ?? 'im_api'
  };

  if (opts.body) {
    envelope['body'] = opts.body;
  }

  const errMsg = RequestEnvelope.verify(envelope);

  if (errMsg) {
    throw new Error(`protobuf verify failed: ${errMsg}`);
  }

  const message = RequestEnvelope.create(envelope);

  return RequestEnvelope.encode(message).finish();
}

export async function decodeResponseRaw(buffer: Uint8Array): Promise<Record<string, unknown>> {
  const root = await loadRoot();
  const ResponseEnvelope = root.lookupType('im.ResponseEnvelope');
  const decoded = ResponseEnvelope.decode(buffer);

  return ResponseEnvelope.toObject(decoded, {
    longs: String,
    enums: String,
    defaults: true
  }) as Record<string, unknown>;
}
