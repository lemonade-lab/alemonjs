import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { normalizeInboundMessage } from '../../common/cbp/normalize.js';

const enabled = () => process.env.ALEMON_CBP_FILE_TRANSPORT === '1';

const getDirectory = () => resolve(process.env.ALEMON_CBP_FILE_DIR || join(process.cwd(), '.alemon', 'cbp'));

const maxEvents = () => {
  const value = Number(process.env.ALEMON_CBP_FILE_MAX_EVENTS ?? 200);

  return Number.isInteger(value) && value > 0 ? Math.min(value, 1000) : 200;
};

const maxBytes = () => {
  const value = Number(process.env.ALEMON_CBP_FILE_MAX_BYTES ?? 1024 * 1024);

  return Number.isInteger(value) && value > 1024 ? Math.min(value, 10 * 1024 * 1024) : 1024 * 1024;
};

const writeAtomicJSON = (path: string, value: unknown) => {
  mkdirSync(dirname(path), { recursive: true });
  const tempPath = `${path}.${process.pid}.${Date.now()}.tmp`;

  writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  renameSync(tempPath, path);
};

const readJSON = (path: string): Record<string, unknown> => {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  } catch {
    return {};
  }
};

const cleanEvent = (event: Record<string, unknown>, directory: string) => {
  const output = { ...event };
  const qrcode = output.QRCode;

  if (!qrcode || typeof qrcode !== 'object' || Array.isArray(qrcode)) {
    return output;
  }

  const qr = { ...(qrcode as Record<string, unknown>) };
  const base64 = qr.imageBase64;

  if (typeof base64 === 'string' && base64.length > 0) {
    try {
      const qrcodeDirectory = join(directory, 'qrcode');

      // Only the current challenge is retained; a refresh replaces prior image data.
      rmSync(qrcodeDirectory, { recursive: true, force: true });
      mkdirSync(qrcodeDirectory, { recursive: true });
      const loginId = typeof output.LoginId === 'string' ? output.LoginId : 'current';
      const imagePath = join(qrcodeDirectory, `${loginId}.png`);

      writeFileSync(imagePath, Buffer.from(base64, 'base64'));
      qr.imagePath = imagePath;
    } catch {
      // The event remains useful through its URL if the local image cannot be saved.
    }
  }

  delete qr.imageBase64;
  output.QRCode = qr;

  return output;
};

const appendEvent = (directory: string, event: Record<string, unknown>) => {
  const path = join(directory, 'events.jsonl');
  let lines: string[] = [];

  try {
    lines = readFileSync(path, 'utf8').split('\n').filter(Boolean);
  } catch {
    // First event.
  }

  lines.push(JSON.stringify(event));
  lines = lines.slice(-maxEvents());

  while (lines.length > 1 && Buffer.byteLength(`${lines.join('\n')}\n`) > maxBytes()) {
    lines.shift();
  }

  writeAtomicJSONLines(path, lines);
};

const writeAtomicJSONLines = (path: string, lines: string[]) => {
  mkdirSync(dirname(path), { recursive: true });
  const tempPath = `${path}.${process.pid}.${Date.now()}.tmp`;

  writeFileSync(tempPath, lines.length ? `${lines.join('\n')}\n` : '', 'utf8');
  renameSync(tempPath, path);
};

const updateStatus = (directory: string, name: string, data: Record<string, unknown>, at: number) => {
  const path = join(directory, 'status.json');
  const status = readJSON(path);

  status.updatedAt = at;
  if (name === 'login.qrcode' || name === 'login.success') {
    status.login = data;
  }
  if (name === 'connection.ready') {
    status.connection = data;
  }
  if (name === 'login.success' || name === 'connection.ready') {
    const qrcodeDirectory = join(directory, 'qrcode');

    rmSync(qrcodeDirectory, { recursive: true, force: true });
  }

  writeAtomicJSON(path, status);
};

/**
 * Writes a small, bounded CBP lifecycle mirror for unrelated local processes.
 * It is intentionally opt-in so regular applications perform no file I/O.
 */
export const publishCBPFileEvent = (message: unknown) => {
  if (!enabled()) {
    return;
  }

  try {
    const normalized = normalizeInboundMessage(message);

    if (normalized?.kind !== 'event' || !['login.qrcode', 'login.success', 'connection.ready'].includes(normalized.eventName)) {
      return;
    }

    const directory = getDirectory();
    const event = cleanEvent(normalized.event, directory);
    const record = { id: normalized.id, at: normalized.timestamp, name: normalized.eventName, data: event };

    appendEvent(directory, record);
    updateStatus(directory, normalized.eventName, event, normalized.timestamp);
  } catch (error) {
    logger.warn?.(`[CBP][file] 写入生命周期事件失败：${error instanceof Error ? error.message : String(error)}`);
  }
};

/** Stores CBP availability in the same current-state file when file transport is enabled. */
export const publishCBPFileReady = (data: Record<string, unknown>) => {
  if (!enabled()) {
    return;
  }

  try {
    const directory = getDirectory();
    const path = join(directory, 'status.json');
    const status = readJSON(path);

    status.updatedAt = Date.now();
    status.cbp = data;
    writeAtomicJSON(path, status);
  } catch (error) {
    logger.warn?.(`[CBP][file] 写入 CBP 状态失败：${error instanceof Error ? error.message : String(error)}`);
  }
};
