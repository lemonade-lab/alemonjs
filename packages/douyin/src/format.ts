import type { DataEnums } from 'alemonjs';

export type BridgeSegment = { type: string; text?: string; url?: string; name?: string };

/** Preserve framework segments for a trusted local bridge while offering a portable text fallback. */
export const dataToBridgeMessage = (format: DataEnums[] = [], hideUnsupported?: boolean | number) => {
  const segments: BridgeSegment[] = [];
  let text = '';

  for (const item of format) {
    if (item.type === 'Text' || item.type === 'MarkdownOriginal') {
      const value = String(item.value);

      text += value;
      segments.push({ type: 'text', text: value });
      continue;
    }
    if (item.type === 'Markdown') {
      const value = (item.value as any[]).map(part => String(part.value ?? '')).join('');

      text += value;
      segments.push({ type: 'text', text: value });
      continue;
    }
    if (item.type === 'Mention') {
      const value = `@${item.value}`;

      text += value;
      segments.push({ type: 'mention', text: value });
      continue;
    }
    if (item.type === 'Link') {
      const url = String((item as any).options?.link ?? item.value);
      const value = `${item.value} (${url})`;

      text += value;
      segments.push({ type: 'link', text: String(item.value), url });
      continue;
    }
    if (item.type === 'Image' || item.type === 'ImageURL' || item.type === 'ImageFile') {
      segments.push({ type: 'image', url: String(item.value) });
      continue;
    }
    if (item.type === 'Audio') {
      segments.push({ type: 'audio', url: String(item.value) });
      continue;
    }
    if (item.type === 'Video') {
      segments.push({ type: 'video', url: String(item.value) });
      continue;
    }
    if (item.type === 'Attachment') {
      segments.push({ type: 'file', url: String(item.value), name: item.options?.filename });
      continue;
    }
    if (!hideUnsupported) {
      text += `[${item.type}]`;
      segments.push({ type: String(item.type).toLowerCase() });
    }
  }

  return { text: text.trim(), segments };
};
