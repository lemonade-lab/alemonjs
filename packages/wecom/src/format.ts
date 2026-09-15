import type { DataEnums } from 'alemonjs';

/** Converts framework content into the two message forms natively accepted by WeCom AI bots. */
export const dataToWecomMessage = (format: DataEnums[] = [], hideUnsupported?: boolean | number) => {
  const markdown: string[] = [];
  const text: string[] = [];

  for (const item of format) {
    if (item.type === 'Text') {
      text.push(String(item.value));
    } else if (item.type === 'MarkdownOriginal') {
      markdown.push(String(item.value));
    } else if (item.type === 'Markdown') {
      markdown.push((item.value as any[]).map(part => String(part.value ?? '')).join(''));
    } else if (item.type === 'Link') {
      const url = (item as any).options?.link ?? item.value;

      text.push(`${item.value} (${url})`);
    } else if (item.type === 'Mention') {
      text.push(item.value === 'all' || item.value === 'everyone' ? '@所有人' : `@${item.value}`);
    } else if (!hideUnsupported) {
      text.push(`[${item.type}]`);
    }
  }

  const content = [...markdown, ...text].filter(Boolean).join(markdown.length ? '\n' : '');

  return markdown.length ? { msgtype: 'markdown', markdown: { content } } : { msgtype: 'text', text: { content } };
};

/**
 * WeCom's `sendMessage` API does not accept `msgtype: text`; proactive text
 * must be represented as Markdown. Contextual `reply` calls can still use text.
 */
export const toWecomProactiveMessage = (message: ReturnType<typeof dataToWecomMessage>) => {
  if (message.msgtype === 'text') {
    return { msgtype: 'markdown' as const, markdown: { content: message.text.content } };
  }

  return message;
};
