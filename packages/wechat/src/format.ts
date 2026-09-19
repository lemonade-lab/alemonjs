import type { DataEnums } from 'alemonjs';
import { markdownToPlainText } from 'alemonjs/markdown';

/** Wechaty 的 say 使用纯文本，按输入顺序保留引用及其子节点。 */
export const formatWechatText = (format: DataEnums[] = []): string => {
  return format
    .map(item => {
      switch (item.type) {
        case 'Text':
        case 'Mention':
        case 'MarkdownOriginal':
          return String(item.value);
        case 'Markdown':
          return markdownToPlainText(item.value);
        case 'Link':
          return item.options?.link ? `${item.value} (${item.options.link})` : item.value;
        default:
          return '';
      }
    })
    .join('');
};
