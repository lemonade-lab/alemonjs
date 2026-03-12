import type { DataEnums, DataMarkDown } from 'alemonjs';

/**
 * 将结构化 Markdown 子元素数组转为 KMarkdown 格式
 * KOOK 支持 KMarkdown，所以可以保留部分格式
 */
export const markdownToKMarkdown = (items: DataMarkDown['value']): string => {
  return items
    .map(item => {
      switch (item.type) {
        case 'MD.text':
          return item.value;
        case 'MD.title':
          return `**${item.value}**\n`;
        case 'MD.subtitle':
          return `**${item.value}**\n`;
        case 'MD.bold':
          return `**${item.value}**`;
        case 'MD.italic':
        case 'MD.italicStar':
          return `*${item.value}*`;
        case 'MD.strikethrough':
          return `~~${item.value}~~`;
        case 'MD.link': {
          const v = item.value as unknown as { text: string; url: string };

          return `[${v.text}](${v.url})`;
        }
        case 'MD.image':
          return '[图片]';
        case 'MD.list':
          return (
            item.value
              .map(li => {
                if (typeof li.value === 'object') {
                  return `${li.value.index}. ${li.value.text ?? ''}`;
                }

                return `- ${li.value}`;
              })
              .join('\n') + '\n'
          );
        case 'MD.blockquote':
          return `> ${item.value}\n`;
        case 'MD.divider':
          return '---\n';
        case 'MD.newline':
          return '\n';
        case 'MD.code': {
          const lang = item?.options?.language || '';

          return `\`\`\`${lang}\n${item.value}\n\`\`\`\n`;
        }
        case 'MD.mention':
          if (item.value === 'everyone') {
            return '(met)all(met)';
          }

          return `(met)${item.value ?? ''}(met)`;
        case 'MD.content':
          return item.value;
        case 'MD.button':
          return `[${item.value}]`;
        default:
          return String((item as any)?.value ?? '');
      }
    })
    .join('');
};

/**
 * 将原始 Markdown 字符串转为 KMarkdown
 * KOOK 的 KMarkdown 与标准 Markdown 语法接近，大部分可直接透传
 */
export const markdownRawToKMarkdown = (raw: string): string => {
  // KMarkdown 基本兼容标准 Markdown，仅去除不支持的图片语法
  let text = raw;

  // 图片 → 占位
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, '[图片]');

  return text;
};

/**
 * 将 DataEnums 数组中不被原生支持的类型降级为 KMarkdown 文本
 *
 * kook 原生支持: Text, Mention, Link, Image, ImageFile, ImageURL
 * 其余类型（Markdown, MarkdownOriginal, Button, Ark 等）降级为 KMarkdown
 */
export const dataEnumToKMarkdown = (item: DataEnums): string => {
  switch (item.type) {
    case 'Markdown':
      return markdownToKMarkdown((item as any).value);

    case 'MarkdownOriginal':
      return markdownRawToKMarkdown(String(item.value));

    case 'BT.group':
    case 'ButtonGroup':
      return (item as any).value.map((row: any) => row.value.map((btn: any) => `[${btn.value}]`).join(' ')).join('\n');

    case 'Attachment':
      return `[附件${(item as any).options?.filename ? ': ' + (item as any).options.filename : ''}]`;

    case 'Audio':
      return '[音频]';

    case 'Video':
      return '[视频]';

    default:
      return '';
  }
};
