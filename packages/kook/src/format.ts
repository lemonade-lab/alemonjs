import type { DataEnums, DataMarkDown } from 'alemonjs';

/**
 * 将结构化 Markdown 子元素数组转为 KMarkdown 格式
 * KOOK 支持 KMarkdown，所以可以保留部分格式
 */
export const markdownToKMarkdown = (items: DataMarkDown['value'], hideUnsupported?: boolean | number): string => {
  if (Number(hideUnsupported) >= 4) return '';

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

          if (Number(hideUnsupported) >= 3) return '';

          return Number(hideUnsupported) >= 2 ? v.url : `[${v.text}](${v.url})`;
        }
        case 'MD.image':
          return hideUnsupported ? '' : '[图片]';
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
          return hideUnsupported ? '' : '---\n';
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
          if (Number(hideUnsupported) >= 3) return '';
          if (Number(hideUnsupported) >= 2) {
            return (item as any).options?.data || String(item.value);
          }

          return hideUnsupported ? String(item.value) : `[${item.value}]`;
        default:
          return String((item as any)?.value ?? '');
      }
    })
    .join('')
    .trim();
};

/**
 * 将原始 Markdown 字符串转为 KMarkdown
 * KOOK 的 KMarkdown 与标准 Markdown 语法接近，大部分可直接透传
 */
export const markdownRawToKMarkdown = (raw: string, hideUnsupported?: boolean | number): string => {
  if (Number(hideUnsupported) >= 4) return '';

  // KMarkdown 基本兼容标准 Markdown，仅去除不支持的图片语法
  let text = raw;

  // 图片 → 占位或隐藏
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, hideUnsupported ? '' : '[图片]');

  return text;
};

/**
 * 将 DataEnums 数组中不被原生支持的类型降级为 KMarkdown 文本
 *
 * kook 原生支持: Text, Mention, Link, Image, ImageFile, ImageURL
 * 其余类型（Markdown, MarkdownOriginal, Button, Ark 等）降级为 KMarkdown
 */
export const dataEnumToKMarkdown = (item: DataEnums, hideUnsupported?: boolean | number): string => {
  if (Number(hideUnsupported) >= 4) return '';

  switch (item.type) {
    case 'Markdown':
      return markdownToKMarkdown((item as any).value, hideUnsupported);

    case 'MarkdownOriginal':
      return markdownRawToKMarkdown(String(item.value), hideUnsupported);

    case 'BT.group':
    case 'ButtonGroup':
      return hideUnsupported ? '' : (item as any).value.map((row: any) => row.value.map((btn: any) => `[${btn.value}]`).join(' ')).join('\n');

    case 'Attachment':
      return hideUnsupported ? '' : `[附件${(item as any).options?.filename ? ': ' + (item as any).options.filename : ''}]`;

    case 'Audio':
      return hideUnsupported ? '' : '[音频]';

    case 'Video':
      return hideUnsupported ? '' : '[视频]';

    default:
      return '';
  }
};
