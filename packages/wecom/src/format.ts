import { markdownToPlainText } from 'alemonjs/markdown';
import type { DataEnums } from 'alemonjs';

/** Converts framework content into the two message forms natively accepted by WeCom AI bots. */
export const dataToWecomMessage = (format: DataEnums[] = [], hideUnsupported?: boolean | number) => {
  const parts: string[] = [];
  let hasMarkdown = false;

  for (const item of format) {
    if (item.type === 'Text') {
      parts.push(String(item.value));
    } else if (item.type === 'MarkdownOriginal') {
      hasMarkdown = true;
      parts.push(String(item.value));
    } else if (item.type === 'Markdown') {
      hasMarkdown = true;
      parts.push(markdownToPlainText(item.value, hideUnsupported));
    } else if (item.type === 'Link') {
      const url = (item as any).options?.link ?? item.value;

      parts.push(`${item.value} (${url})`);
    } else if (item.type === 'Mention') {
      parts.push(item.value === 'all' || item.value === 'everyone' ? '@所有人' : `@${item.value}`);
    } else if (!hideUnsupported) {
      parts.push(`[${item.type}]`);
    }
  }

  const content = parts.filter(Boolean).join(hasMarkdown ? '\n' : '');

  return hasMarkdown ? { msgtype: 'markdown', markdown: { content } } : { msgtype: 'text', text: { content } };
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
