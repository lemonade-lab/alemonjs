import axios from 'axios';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { fileTypeFromBuffer } from 'file-type';
import type { MediaResource, MediaSourceInput, MediaResourcePage } from 'alemonjs';
import type { QQBotAPI } from './sdk/api.js';

const LIMIT = 10 * 1024 * 1024;
const supported: Record<string, string[]> = { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/gif': ['.gif'], 'image/webp': ['.webp'] };

/** Bot-scoped Markdown image materials. No access token is forwarded to COS. */
export class QQImageMaterials {
  #cache = new Map<string, { resource: MediaResource; until: number }>();
  #pending = new Map<string, Promise<MediaResource>>();
  constructor(private readonly client: QQBotAPI, private readonly botId: string) {}

  #resource(raw: any): MediaResource {
    if (typeof raw?.image_id !== 'string' || typeof raw.url !== 'string' || !raw.url.startsWith('qqbot-media://image/v1/')) {
      throw new Error('QQ returned an invalid Markdown image resource');
    }

    return {
      kind: 'media-resource',
      type: 'image',
      id: raw.image_id,
      owner: { platform: 'qq-bot', botId: this.botId },
      usage: 'markdown',
      reference: raw.url,
      name: raw.file_name,
      expiration: {
        mode: 'sliding',
        ...(Number.isSafeInteger(raw.ttl) && raw.ttl > 0 && { windowSeconds: raw.ttl }),
        ...(Number.isFinite(raw.expires_at) && { expiresAt: raw.expires_at * 1000 })
      }
    };
  }

  async upload(source: MediaSourceInput): Promise<MediaResource> {
    const values = [source?.url, source?.data, source?.filePath].filter(value => value !== undefined);

    if (values.length !== 1 || values.some(value => typeof value !== 'string' || !value)) {
      throw new Error('Provide exactly one image source');
    }
    let bytes: Buffer;
    let name = source.name;

    if (source.filePath) {
      const info = await stat(source.filePath);

      if (!info.isFile() || info.size > LIMIT) {
        throw new Error('Markdown image must be a regular file no larger than 10 MiB');
      }
      bytes = await readFile(source.filePath);
      name ??= basename(source.filePath);
    } else if (source.url) {
      const url = new URL(source.url);

      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Image URL must use HTTP or HTTPS');
      }
      const response = await axios.get<ArrayBuffer>(source.url, {
        responseType: 'arraybuffer',
        timeout: 20000,
        maxContentLength: LIMIT,
        headers: { Authorization: null, Cookie: null }
      });

      bytes = Buffer.from(response.data);
      name ??= basename(url.pathname) || undefined;
    } else {
      const data = source.data.replace(/^base64:\/\//, '');

      if (data.length > Math.ceil(LIMIT / 3) * 4 || !/^[a-z\d+/]*={0,2}$/i.test(data) || data.length % 4 !== 0) {
        throw new Error('Invalid or oversized base64 image');
      }
      bytes = Buffer.from(data, 'base64');
    }
    if (!bytes.length || bytes.length > LIMIT) {
      throw new Error('Markdown image must contain at most 10 MiB of image data');
    }
    const detected = await fileTypeFromBuffer(bytes);

    if (!detected || !supported[detected.mime]) {
      throw new Error('QQ Markdown materials support PNG, JPEG, GIF and WebP images');
    }
    if (!name || (!source.name && !extname(name))) {
      name = `${name || 'image'}.${detected.ext}`;
    }
    if (!supported[detected.mime].includes(extname(name).toLowerCase())) {
      throw new Error('Image filename extension must match its actual MIME type');
    }
    const key = `${createHash('sha256').update(bytes).digest('hex')}:${name}:${detected.mime}`;
    const cached = this.#cache.get(key);

    if (cached && cached.until > Date.now()) {
      return structuredClone(cached.resource);
    }
    const pending = this.#pending.get(key);

    if (pending !== undefined) {
      return structuredClone(await pending);
    }
    if (this.#pending.size >= 100) {
      throw new Error('Too many concurrent material uploads');
    }
    const task = this.#upload(bytes, name, detected.mime).then(resource => {
      if (this.#cache.size >= 100) {
        this.#cache.delete(this.#cache.keys().next().value);
      }
      // A conservative validity bound, not a claim about the sliding server expiry.
      const lifetime = resource.expiration?.windowSeconds ?? 0;

      if (lifetime > 0) {
        this.#cache.set(key, { resource, until: Date.now() + lifetime * 1000 });
      }

      return resource;
    });

    this.#pending.set(key, task);
    try {
      return structuredClone(await task);
    } finally {
      this.#pending.delete(key);
    }
  }

  async #upload(bytes: Buffer, name: string, mime: string): Promise<MediaResource> {
    const prepared = await this.client.groupService({
      method: 'POST',
      url: '/v2/media-images/prepare',
      data: {
        file_name: name,
        file_size: bytes.length,
        content_type: mime,
        md5: createHash('md5').update(bytes).digest('hex'),
        sha1: createHash('sha1').update(bytes).digest('hex')
      }
    });
    const uploadUrl = new URL(prepared.presigned_url);

    if (!['http:', 'https:'].includes(uploadUrl.protocol) || !prepared.upload_id) {
      throw new Error('QQ returned an invalid material upload task');
    }
    const uploaded = await axios
      .put(prepared.presigned_url, bytes, {
        timeout: 20000,
        maxBodyLength: LIMIT,
        maxRedirects: 0,
        headers: { 'Content-Type': mime, Authorization: null, Cookie: null }
      })
      .catch(() => {
        throw new Error('Markdown image binary upload failed');
      });
    const md5 = String(uploaded.headers.etag ?? '')
      .replace(/^"|"$/g, '')
      .toLowerCase();

    if (md5 !== createHash('md5').update(bytes).digest('hex')) {
      throw new Error('Markdown image upload returned an invalid ETag');
    }
    const completed = await this.client.groupService({ method: 'POST', url: '/v2/media-images/complete', data: { upload_id: prepared.upload_id, md5 } });

    return { ...this.#resource(completed), name };
  }

  async list(cursor?: string): Promise<MediaResourcePage> {
    const raw = await this.client.groupService({ method: 'GET', url: '/v2/media-images', params: { cursor } });

    return { Items: raw.images.map(item => this.#resource(item)), NextCursor: raw.next_cursor || undefined, Total: raw.total };
  }

  async delete(resource: MediaResource) {
    if (resource.owner?.platform !== 'qq-bot' || resource.owner.botId !== this.botId || resource.usage !== 'markdown' || !resource.id) {
      throw new Error('Image resource does not belong to this bot and usage');
    }
    await this.client.groupService({ method: 'DELETE', url: `/v2/media-images/${encodeURIComponent(resource.id)}/delete` });
    for (const [key, entry] of this.#cache) {
      if (entry.resource.id === resource.id) {
        this.#cache.delete(key);
      }
    }

    return {};
  }
}
