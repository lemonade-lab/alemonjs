import type { DataEnums, DataMarkDown } from 'alemonjs';

/**
 * 将结构化 Markdown 子元素数组转为 Telegram HTML 格式
 * Telegram 支持 HTML parse_mode，可以保留部分格式
 */
export const markdownToTelegramText = (items: DataMarkDown['value']): string => {
  return items
    .map(item => {
      switch (item.type) {
        case 'MD.text':
          return item.value;
        case 'MD.title':
          return `<b>${item.value}</b>\n`;
        case 'MD.subtitle':
          return `<b>${item.value}</b>\n`;
        case 'MD.bold':
          return `<b>${item.value}</b>`;
        case 'MD.italic':
        case 'MD.italicStar':
          return `<i>${item.value}</i>`;
        case 'MD.strikethrough':
          return `<s>${item.value}</s>`;
        case 'MD.link': {
          const v = item.value as unknown as { text: string; url: string };

          return `<a href="${v.url}">${v.text}</a>`;
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

                return `· ${li.value}`;
              })
              .join('\n') + '\n'
          );
        case 'MD.blockquote':
          return `> ${item.value}\n`;
        case 'MD.divider':
          return '————————\n';
        case 'MD.newline':
          return '\n';
        case 'MD.code': {
          const lang = item?.options?.language || '';

          return `<pre><code${lang ? ` class="language-${lang}"` : ''}>${item.value}</code></pre>\n`;
        }
        case 'MD.mention':
          if (item.value === 'everyone') {
            return '@全体成员';
          }

          return `@${item.value ?? ''}`;
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
 * 将原始 Markdown 字符串转为纯文本
 */
export const markdownRawToText = (raw: string): string => {
  let text = raw;

  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, '[图片]');
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  text = text.replace(/^#{1,6}\s+/gm, '');
  text = text.replace(/(\*{3}|_{3})([^*_]+)\1/g, '$2');
  text = text.replace(/(\*{2}|_{2})([^*_]+)\1/g, '$2');
  text = text.replace(/(?<!\*)\*(?!\*)([^*]+)(?<!\*)\*(?!\*)/g, '$1');
  text = text.replace(/(?<!_)_(?!_)([^_]+)(?<!_)_(?!_)/g, '$1');
  text = text.replace(/~~([^~]+)~~/g, '$1');
  text = text.replace(/`([^`]+)`/g, '$1');
  text = text.replace(/```[\s\S]*?```/g, match => {
    return match.replace(/```\w*\n?/g, '').trim();
  });
  text = text.replace(/^>\s+/gm, '');
  text = text.replace(/^[-*_]{3,}\s*$/gm, '————————');
  text = text.replace(/^[\s]*[-*+]\s+/gm, '· ');
  text = text.replace(/^[\s]*(\d+)\.\s+/gm, '$1. ');

  return text.trim();
};

/**
 * 将 DataEnums 数组中不被原生支持的类型降级为文本
 *
 * telegram 原生支持: Text, Mention, Link, Image, ImageFile, ImageURL
 * 其余类型（Markdown, MarkdownOriginal, Button, Ark 等）降级
 */
export const dataEnumToText = (item: DataEnums): string => {
  switch (item.type) {
    case 'Markdown':
      return markdownToTelegramText((item as any).value);

    case 'MarkdownOriginal':
      return markdownRawToText(String(item.value));

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
