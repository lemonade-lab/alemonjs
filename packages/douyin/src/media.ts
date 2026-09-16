import { open } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const maxBytes = 10 * 1024 * 1024;

/** Bounded media loading. Uses no account cookies or authentication headers. */
export async function loadMedia(source: string): Promise<Uint8Array> {
  if (source.startsWith('base64://')) {
    const encoded = source.slice(9);

    if (encoded.length > Math.ceil(maxBytes / 3) * 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) {
      throw new Error('Invalid or oversized base64 media');
    }
    const bytes = Buffer.from(encoded, 'base64');

    if (!bytes.length || bytes.length > maxBytes) {
      throw new Error('Empty or oversized media');
    }

    return bytes;
  }
  if (source.startsWith('file://')) {
    const file = await open(fileURLToPath(source), 'r');

    try {
      const stat = await file.stat();

      if (!stat.isFile() || !stat.size || stat.size > maxBytes) {
        throw new Error('Empty or oversized media');
      }
      const bytes = Buffer.alloc(stat.size);
      const { bytesRead } = await file.read(bytes, 0, bytes.length, 0);

      if (bytesRead !== bytes.length) {
        throw new Error('Media file changed while reading');
      }

      return bytes;
    } finally {
      await file.close();
    }
  }
  const url = new URL(source);

  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Unsupported media URL');
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(30000), credentials: 'omit' });

  if (!response.ok || !response.body) {
    await response.body?.cancel();
    throw new Error('Media download failed');
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const chunk = await reader.read();

      if (chunk.done) {
        break;
      }
      total += chunk.value.length;
      if (total > maxBytes) {
        throw new Error('Media exceeds 10 MiB');
      }
      chunks.push(chunk.value);
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
  if (!total) {
    throw new Error('Empty media');
  }

  return Buffer.concat(chunks);
}
