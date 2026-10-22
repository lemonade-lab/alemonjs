import { cloneDeep } from 'lodash-es';
import type { MediaImage, MediaImageSource, MediaResource, MediaSourceInput } from '../types/media-resource.js';
import type { ActionContext, ActionTarget, DataEnums } from '../types/index.js';
import { createActionCaller } from './hooks/action-context.js';
import { ResultCode } from '../common/variable.js';

export const validateMediaSource = (source: MediaSourceInput) => {
  const values = [source?.url, source?.filePath, source?.data].filter(value => value !== undefined);

  if (values.length !== 1 || values.some(value => typeof value !== 'string' || !value)) {
    throw new Error('Provide exactly one media source: url, filePath or data');
  }
  if (source.url && !['http:', 'https:'].includes(new URL(source.url).protocol)) {
    throw new Error('Media source URL must use HTTP or HTTPS');
  }
  if (source.name !== undefined && (typeof source.name !== 'string' || !source.name)) {
    throw new Error('Media source name must be a non-empty string');
  }
};
/** Pure construction: no IO, credentials, upload or target binding. */
export const Media = {
  image(source: MediaSourceInput): MediaImageSource {
    validateMediaSource(source);

    return { kind: 'media-source', type: 'image', source: { ...source } };
  }
};

export const assertMediaOwner = (image: MediaImage, context: ActionContext, target?: ActionTarget) => {
  if (image.type !== 'image' || !['media-source', 'media-resource'].includes(image.kind)) {
    throw new Error('Expected an image source or resource');
  }
  if (image.kind === 'media-source') {
    validateMediaSource(image.source);

    return;
  }
  const botId = target?.BotId ?? context.BotId;

  if (
    typeof image.id !== 'string' ||
    !image.id ||
    typeof image.reference !== 'string' ||
    !image.reference ||
    typeof image.owner?.platform !== 'string' ||
    !image.owner.platform ||
    typeof image.owner.botId !== 'string' ||
    !image.owner.botId
  ) {
    throw new Error('Invalid media resource');
  }
  if ((context.Platform && image.owner.platform !== context.Platform) || (botId && image.owner.botId !== botId)) {
    throw new Error('Media resource belongs to a different platform or bot');
  }
  if (image.target && (image.target.scope !== target?.scope || image.target.targetId !== target.targetId)) {
    throw new Error('Media resource belongs to a different conversation');
  }
};

export class MediaPreparationError extends Error {
  constructor(message: string, readonly resources: MediaResource[], readonly failure?: unknown) {
    super(message);
  }
}

export const hasStructuredMedia = (items: any[]): boolean =>
  items.some(
    item => Boolean(item.media) || ((item.type === 'Markdown' || item.type === 'MD.blockquote') && Array.isArray(item.value) && hasStructuredMedia(item.value))
  );

/** Resolve only structured sources. Legacy strings keep their existing semantics. */
export const prepareMessageMedia = async (format: DataEnums[], context: ActionContext, target?: ActionTarget) => {
  // Snapshot synchronously, before the first await or application-side mutation.
  const snapshot = cloneDeep(format);
  const resources: MediaResource[] = [];
  const call = createActionCaller({ ...context, Target: target, BotId: target?.BotId ?? context.BotId });
  // Validate every ownership boundary before initiating any remote upload.
  const validate = (items: any[]) => {
    for (const item of items) {
      if (item.media) {
        if (item.type !== 'Image' && item.type !== 'MD.image') {
          throw new Error('Media sources must be placed in image nodes');
        }
        assertMediaOwner(item.media, context, target);
        if (item.media.kind === 'media-resource' && item.media.usage !== (item.type === 'MD.image' ? 'markdown' : 'message')) {
          throw new Error('Media resource was prepared for a different usage; reuse the original source instead');
        }
      }
      if ((item.type === 'Markdown' || item.type === 'MD.blockquote') && Array.isArray(item.value)) {
        validate(item.value);
      }
    }
  };
  const walk = async (items: any[]): Promise<any[]> => {
    const output = [];

    for (const item of items) {
      if ((item.type === 'Markdown' || item.type === 'MD.blockquote') && Array.isArray(item.value)) {
        output.push({ ...item, value: await walk(item.value) });
      } else if ((item.type === 'Image' || item.type === 'MD.image') && item.media) {
        const image = item.media as MediaImage;
        const usage = item.type === 'MD.image' ? 'markdown' : 'message';

        if (image.kind === 'media-source' && usage === 'message') {
          const source = image.source;
          const value = source.url ?? (source.filePath ? `file://${source.filePath}` : `base64://${source.data.replace(/^base64:\/\//, '')}`);

          output.push({ ...item, value, media: undefined });
          continue;
        }
        if (image.kind === 'media-resource' && image.usage !== usage) {
          throw new Error('Media resource was prepared for a different usage; reuse the original source instead');
        }
        const result = await call('media.resource.resolve', { image, usage, target });

        if (result.code !== ResultCode.Ok) {
          throw new MediaPreparationError('This platform could not prepare the image for its placement', resources, result);
        }
        const resource = result.data;

        assertMediaOwner(resource, context, target);
        if (resource.usage !== usage) {
          throw new Error('Adapter returned a resource for a different usage');
        }
        resources.push(resource);
        output.push({ ...item, value: resource.reference, media: usage === 'message' ? resource : undefined });
      } else {
        output.push(item);
      }
    }

    return output;
  };

  try {
    validate(snapshot);
    const prepared = await walk(snapshot);

    return { format: prepared as DataEnums[], resources };
  } catch (error) {
    if (error instanceof MediaPreparationError) {
      throw error;
    }
    throw new MediaPreparationError(error instanceof Error ? error.message : 'Media preparation failed', resources, error);
  }
};
