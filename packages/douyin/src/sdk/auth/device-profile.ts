// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
/**
 * 官方桌面设备注册协议（对齐 douyin-im device-registration）：
 * 真实硬件标识 → /service/2/desktop/device_register/ 签发数字 device_id/install_id，
 * 服务端认识设备后登录不再强制 MFA 二次验证。
 */
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { gzipSync } from 'node:zlib';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import type { DouyinHttp } from '../http/client.js';

const run = promisify(execFile);
const ORIGIN = 'https://imdesktop.douyin.com';
const CHANNEL = 'local_test';

export interface DesktopHardware {
  release: string;
  model: string;
  uuid: string;
  serial: string;
  mac: string;
  resolution: string;
  timezone: string;
  timezoneName: string;
  timezoneOffset: number;
  language: string;
}

export interface RegisteredDevice {
  deviceId: string;
  installId: string;
}

/** Desktop 系统设备信息 2.0.1 / passport-util logEncrypt v3（替换+轮转，非 AES） */
const SBOX = Buffer.from(
  '637c777bf26b6fc53001672bfed7ab76ca82c97dfa5947f0add4a2af9ca472c0b7fd9326363ff7cc34a5e5f171d8311504c723c31896059a071280e2eb27b27509832c1a1b6e5aa0523bd6b329e32f8453d100ed20fcb15b6acbbe394a4c58cfd0efaafb434d338545f9027f503c9fa851a3408f929d38f5bcb6da2110fff3d2cd0c13ec5f974417c4a77e3d645d197360814fdc222a908846eeb814de5e0bdbe0323a0a4906245cc2d3ac629195e479e7c8376d8dd54ea96c56f4ea657aae08ba78252e1ca6b4c6e8dd741f4bbd8b8a703eb5664803f60e613557b986c11d9ee1f8981169d98e949b1e87e9ce5528df8ca1890dbfe6426841992d0fb054bb16',
  'hex'
);
const KEY = Buffer.from('I+D&*76:j27kVH<us9&d')
  .subarray(0, 16)
  .map(b => SBOX[b]);

export function encodeDeviceLog(value: string, timestamp = Date.now()): Buffer {
  const gzip = gzipSync(Buffer.from(value), { level: 6, memLevel: 4 });

  gzip.writeUInt32LE(Math.floor(timestamp / 1000), 4);
  gzip[9] = 3;
  const padding = (16 - (gzip.length % 16)) % 16;
  const input = Buffer.concat([gzip, Buffer.alloc(padding, padding)]);
  const output = Buffer.alloc(6 + input.length);

  output.set([0x74, 0x63, 3, padding, 0, 3]);
  for (let base = 0; base < input.length; base += 16) {
    for (let word = 0; word < 4; word++) {
      for (let byte = 0; byte < 4; byte++) {
        const index = word * 4 + byte;

        output[6 + base + index] = SBOX[input[base + word * 4 + ((byte + word) % 4)]] ^ KEY[index];
      }
    }
  }

  return output;
}

/** Desktop 的 Eo(app.getGuid()) 兜底；注册成功后被服务端 DID 替换 */
export function guidDeviceId(guid: string): string {
  let hash = 0;

  for (let index = 0; index < guid.length; index++) {
    hash = (31 * hash + guid.charCodeAt(index)) >>> 0;
  }

  return String(hash);
}

export function randomGuid(): string {
  return randomUUID().replaceAll('-', '');
}

/** 读取本机硬件标识（Windows WMI，与官方桌面客户端同源字段） */
export async function readDesktopHardware(): Promise<DesktopHardware> {
  const { stdout } = await run(
    'powershell.exe',
    [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      '$s=Get-CimInstance Win32_ComputerSystemProduct; $d=Get-CimInstance Win32_DiskDrive | Where-Object SerialNumber | Select-Object -First 1; @{model=$s.Name;uuid=$s.UUID;serial=$d.SerialNumber} | ConvertTo-Json -Compress'
    ],
    { encoding: 'utf8', timeout: 15_000, maxBuffer: 8 * 1024 * 1024, windowsHide: true }
  );
  const result = JSON.parse(stdout.trim()) as Record<string, string>;
  const uuid = result['uuid']?.trim() ?? '';
  const serial = result['serial']?.trim() ?? '';

  if (!uuid || !serial) {
    throw new Error('桌面硬件标识不可用');
  }
  const timezone = new Date().toString().split(' ')[5] ?? '';

  return {
    release: os.release(),
    model: result['model']?.trim() ?? '',
    uuid,
    serial,
    mac:
      Object.values(os.networkInterfaces())
        .flat()
        .find(e => e?.mac && e.mac !== '00:00:00:00:00:00')?.mac ?? '',
    resolution: '1707x1067',
    timezone,
    timezoneName: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: -new Date().getTimezoneOffset() * 60,
    language: Intl.DateTimeFormat().resolvedOptions().locale
  };
}

function platformParams(hardware: DesktopHardware): Record<string, string> {
  return {
    aid: '339757',
    channel: CHANNEL,
    os: 'Windows',
    device_platform: 'PC',
    version_code: '1.2.1',
    pc_uuid: hardware.uuid,
    pc_serial: hardware.serial
  };
}

/** 构造 device_register 请求（JSON 整数字段不经 Number 以保留 int64） */
export function buildDeviceRegistration(hardware: DesktopHardware, current?: RegisteredDevice): { url: string; body: Buffer } {
  const common = platformParams(hardware);
  const query = new URLSearchParams({ ...common, os_version: hardware.release, device_type: common['device_platform'] });
  const body = {
    header: {
      device_id: 0,
      install_id: 0,
      os: 'Windows',
      device_platform: 'PC',
      sdk_version: '2.0.1',
      aid: 339757,
      mc: hardware.mac,
      channel: CHANNEL,
      package: 'com.bytedance.aweme-im-pc.desktop',
      language: hardware.language,
      app_version: '1.2.1',
      os_version: hardware.release,
      device_model: hardware.model,
      time_zone: hardware.timezone,
      tz_name: hardware.timezoneName,
      tz_offset: hardware.timezoneOffset,
      resolution: hardware.resolution,
      app_region: 'cn',
      app_language: 'zh-CN',
      display_name: '抖音聊天',
      pc_uuid: hardware.uuid,
      pc_serial: hardware.serial
    },
    _gen_time: 0,
    magic_tag: 'ss_app_log'
  };
  const json = JSON.stringify(body)
    .replace('"device_id":0', `"device_id":${current?.deviceId ?? '0'}`)
    .replace('"install_id":0', `"install_id":${current?.installId ?? '0'}`);

  return { url: `${ORIGIN}/service/2/desktop/device_register/?${query}`, body: encodeDeviceLog(json) };
}

const asDeviceId = (value: unknown): string => {
  if ((typeof value === 'string' && /^[1-9]\d*$/.test(value)) || (typeof value === 'number' && Number.isSafeInteger(value) && value > 0)) {
    return String(value);
  }
  throw new Error('设备注册返回了无效 ID');
};

/** 注册设备换取服务端 device_id/install_id */
export async function registerDesktopDevice(hardware: DesktopHardware, current?: RegisteredDevice): Promise<RegisteredDevice> {
  const request = buildDeviceRegistration(hardware, current);
  const response = await fetch(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'TTNetwork PC' },
    body: new Uint8Array(request.body),
    signal: AbortSignal.timeout(30_000)
  });

  if (!response.ok) {
    throw new Error(`设备注册 HTTP ${response.status}`);
  }
  const result = (await response.json()) as Record<string, unknown>;

  return {
    deviceId: asDeviceId(result['device_id_str'] ?? result['device_id']),
    installId: asDeviceId(result['install_id_str'] ?? result['install_id'])
  };
}

/** 激活已注册设备 */
export async function activateDesktopDevice(hardware: DesktopHardware, device: RegisteredDevice): Promise<void> {
  const query = new URLSearchParams({
    ...platformParams(hardware),
    app_name: '抖音聊天',
    device_id: device.deviceId,
    iid: device.installId
  });
  const response = await fetch(`${ORIGIN}/service/2/app_alert/?${query}`, {
    method: 'POST',
    signal: AbortSignal.timeout(30_000)
  });

  if (!response.ok) {
    throw new Error(`设备激活 HTTP ${response.status}`);
  }
  const result = (await response.json()) as Record<string, unknown>;

  if (result['message'] !== 'success') {
    throw new Error('设备激活未确认');
  }
}

export interface DesktopDeviceIdentity extends RegisteredDevice {
  guid: string;
}

/**
 * 登录前的桌面设备生命周期（对齐 douyin-im startDeviceLifecycle）：
 * 已存身份刷新注册；无身份时硬件注册签发 DID；失败回退 GUID 哈希。
 * 身份为机器级，落盘 accountsDir/device.json。
 */
export async function setupDesktopDevice(deviceFile: string, http?: DouyinHttp): Promise<DesktopDeviceIdentity> {
  let saved: DesktopDeviceIdentity | undefined;

  try {
    saved = JSON.parse(await readFile(deviceFile, 'utf8')) as DesktopDeviceIdentity;
  } catch {
    // 首次登录无已存身份
  }
  const guid = saved?.guid || randomGuid();

  try {
    const hardware = await readDesktopHardware();
    const current = saved?.deviceId && saved?.installId ? { deviceId: saved.deviceId, installId: saved.installId } : undefined;
    const registered = await registerDesktopDevice(hardware, current);

    await activateDesktopDevice(hardware, registered).catch(() => undefined);
    const identity: DesktopDeviceIdentity = { ...registered, guid };

    await writeFile(deviceFile, JSON.stringify(identity), 'utf8');
    http?.setDevice(identity);

    return identity;
  } catch {
    // 注册未获确认：沿用已存身份，无 DID 时回退 GUID 哈希（对齐官方兜底）
    const identity: DesktopDeviceIdentity = saved?.deviceId ? saved : { deviceId: guidDeviceId(guid), installId: '0', guid };

    http?.setDevice(identity);

    return identity;
  }
}
