import type { DataEnums } from 'alemonjs';

/** The IM send endpoint accepts a structured content object. Start with the portable text form. */
export const dataToDouyinContent = (format: DataEnums[] = [], hideUnsupported?: boolean | number) => {
  const text = format
    .map(item => {
      if (item.type === 'Text' || item.type === 'MarkdownOriginal') {
        return String(item.value);
      }
      if (item.type === 'Markdown') {
        return (item.value as any[]).map(part => String(part.value ?? '')).join('');
      }
      if (item.type === 'Link') {
        return `${item.value} (${(item as any).options?.link ?? item.value})`;
      }
      if (item.type === 'Mention') {
        return `@${item.value}`;
      }

      return hideUnsupported ? '' : `[${item.type}]`;
    })
    .join('')
    .trim();

  return { msg_type: 1, text: { content: text } };
};
