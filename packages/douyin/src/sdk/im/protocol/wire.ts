// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
/**
 * 无 schema 的 protobuf wire 协议编解码（等价迁移自 douyin-im src/services/im/wire.ts）。
 * decodeWire 用于诊断与未知 IM 推送；varint/field 编码 helpers 来自 android-ws.ts 的帧构造。
 */

/** A schema-free protobuf field used for diagnostics and unknown IM pushes. */
export type WireField =
  | { field: number; type: 'varint'; value: bigint }
  | { field: number; type: 'fixed64'; value: Uint8Array }
  | { field: number; type: 'fixed32'; value: Uint8Array }
  | { field: number; type: 'string'; value: string }
  | { field: number; type: 'message'; value: WireField[] }
  | { field: number; type: 'bytes'; value: Uint8Array };

export interface WireTreeField {
  f: number;
  t: WireField['type'];
  v: string | WireTreeField[];
}

const MAX_DEPTH = 8;
const textDecoder = new TextDecoder('utf-8', { fatal: true });

function decodeVarint(data: Uint8Array, start: number): { value: bigint; next: number } | null {
  let value = 0n;
  let shift = 0n;

  for (let pos = start; pos < data.length && shift < 70n; pos += 1, shift += 7n) {
    const byte = data[pos];

    value |= BigInt(byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) {
      return { value, next: pos + 1 };
    }
  }

  return null;
}

function safeText(data: Uint8Array): string | null {
  try {
    const text = textDecoder.decode(data);

    for (const ch of text) {
      const code = ch.codePointAt(0);

      if (code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) {
        return null;
      }
    }

    return text;
  } catch {
    return null;
  }
}

/**
 * Best-effort protobuf decoder for traffic whose schema is not known yet.
 * It never throws on a truncated frame: all completely decoded fields are returned.
 */
export function decodeWire(data: Uint8Array, depth = 0): WireField[] {
  const fields: WireField[] = [];
  let pos = 0;

  while (pos < data.length) {
    const tag = decodeVarint(data, pos);

    if (!tag) {
      break;
    }
    pos = tag.next;
    const field = Number(tag.value >> 3n);
    const wireType = Number(tag.value & 7n);

    if (field === 0) {
      break;
    }

    if (wireType === 0) {
      const item = decodeVarint(data, pos);

      if (!item) {
        break;
      }
      pos = item.next;
      fields.push({ field, type: 'varint', value: item.value });
      continue;
    }
    if (wireType === 1 || wireType === 5) {
      const width = wireType === 1 ? 8 : 4;

      if (pos + width > data.length) {
        break;
      }
      const value = data.slice(pos, pos + width);

      pos += width;
      fields.push({ field, type: wireType === 1 ? 'fixed64' : 'fixed32', value });
      continue;
    }
    if (wireType !== 2) {
      break;
    }

    const lengthItem = decodeVarint(data, pos);

    if (!lengthItem || lengthItem.value > BigInt(Number.MAX_SAFE_INTEGER)) {
      break;
    }
    pos = lengthItem.next;
    const length = Number(lengthItem.value);

    if (pos + length > data.length) {
      break;
    }
    const raw = data.slice(pos, pos + length);

    pos += length;

    const text = safeText(raw);
    const trimmed = text?.trimStart() ?? '';
    const knownText =
      trimmed.startsWith('{') ||
      trimmed.startsWith('[') ||
      /^0:\d+:/.test(trimmed) ||
      /^\d+$/.test(trimmed) ||
      trimmed.startsWith('MS4') ||
      /^https?:\/\//.test(trimmed) ||
      /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(trimmed);

    if (text !== null && text !== undefined && knownText) {
      fields.push({ field, type: 'string', value: text });
      continue;
    }
    const nested = depth < MAX_DEPTH ? decodeWire(raw, depth + 1) : [];

    if (nested.length > 0) {
      fields.push({ field, type: 'message', value: nested });
    } else if (text !== null && text !== undefined) {
      fields.push({ field, type: 'string', value: text });
    } else {
      fields.push({ field, type: 'bytes', value: raw });
    }
  }

  return fields;
}

/** JSON-safe diagnostic tree. bigint is represented as decimal and bytes as base64. */
export function decodeWireTree(data: Uint8Array): WireTreeField[] {
  const convert = (field: WireField): WireTreeField => {
    if (field.type === 'message') {
      return { f: field.field, t: field.type, v: field.value.map(convert) };
    }
    if (field.type === 'varint') {
      return { f: field.field, t: field.type, v: field.value.toString() };
    }
    if (field.type === 'string') {
      return { f: field.field, t: field.type, v: field.value };
    }

    return { f: field.field, t: field.type, v: Buffer.from(field.value).toString('base64') };
  };

  return decodeWire(data).map(convert);
}

// ---------------------------------------------------------------------------
// protobuf wire 编码 helpers（等价迁移自 android-ws.ts 帧构造部分）
// ---------------------------------------------------------------------------

export function encodeVarint(value: number | bigint): Buffer {
  let remaining = BigInt(value);
  const bytes: number[] = [];

  do {
    let byte = Number(remaining & 0x7fn);

    remaining >>= 7n;
    if (remaining) {
      byte |= 0x80;
    }
    bytes.push(byte);
  } while (remaining);

  return Buffer.from(bytes);
}

export function fieldVarint(field: number, value: number | bigint): Buffer {
  return Buffer.concat([encodeVarint(field << 3), encodeVarint(value)]);
}

export function fieldBytes(field: number, value: Uint8Array): Buffer {
  return Buffer.concat([encodeVarint((field << 3) | 2), encodeVarint(value.length), Buffer.from(value)]);
}

export function fieldStringValue(field: number, value: string): Buffer {
  return fieldBytes(field, Buffer.from(value));
}

/** 嵌套 map<string,string> 键值项：field { 1: key, 2: value } */
export function kv(field: number, key: string, value: string): Buffer {
  return fieldBytes(field, Buffer.concat([fieldStringValue(1, key), fieldStringValue(2, value)]));
}
