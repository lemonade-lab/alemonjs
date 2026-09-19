import { joinMarkdownParts, renderMarkdownBlockquote } from 'alemonjs/markdown';
import type { DataEnums, DataMarkDown } from 'alemonjs';

const mardownMap = {
  'MD.text': (item: any) => item.value,
  'MD.title': (item: any) => `**${item.value}**\n`,
  'MD.subtitle': (item: any) => `**${item.value}**\n`,
  'MD.bold': (item: any) => `**${item.value}**`,
  'MD.italic': (item: any) => `*${item.value}*`,
  'MD.italicStar': (item: any) => `*${item.value}*`,
  'MD.strikethrough': (item: any) => `~~${item.value}~~`,
  'MD.link': (item: any, hideUnsupported?: boolean | number) => {
    const v = item.value as unknown as { text: string; url?: string };

    if (Number(hideUnsupported) >= 3) {
      return '';
    }

    if (!v.url) {
      return v.text;
    }

    return Number(hideUnsupported) >= 2 ? v.url : `[${v.text}](${v.url})`;
  },
  'MD.image': (_: any, hideUnsupported?: boolean | number) => (hideUnsupported ? '' : '[图片]'),
  'MD.list': (item: any) =>
    item.value
      .map((li: any) => {
        if (typeof li.value === 'object') {
          return `${li.value.index}. ${li.value.text ?? ''}`;
        }

        return `- ${li.value}`;
      })
      .join('\n') + '\n',
  'MD.blockquote': (item: any, hideUnsupported?: boolean | number) => {
    return renderMarkdownBlockquote(item.value, children => markdownToKMarkdown(children, hideUnsupported));
  },
  'MD.divider': (_: any, hideUnsupported?: boolean | number) => (hideUnsupported ? '' : '\n---\n'),
  'MD.newline': () => '\n',
  'MD.code': (item: any) => {
    const lang = item?.options?.language || '';

    return `\`\`\`${lang}\n${item.value}\n\`\`\`\n`;
  },
  'MD.mention': (item: any) => {
    if (item.value === 'everyone') {
      return '(met)all(met)';
    }
    if (item.value) {
      return item.options?.belong === 'channel' ? `(chn)${item.value}(chn)` : `(met)${item.value}(met)`;
    }

    return '';
  },
  'MD.content': (item: any) => item.value,
  'MD.button': (item: any, hideUnsupported?: boolean | number) => {
    if (Number(hideUnsupported) >= 3) {
      return '';
    }
    if (Number(hideUnsupported) >= 2) {
      return item.options?.data || String(item.value);
    }

    return hideUnsupported ? String(item.value) : `[${item.value}]`;
  }
};

/**
 * 将结构化 Markdown 子元素数组转为 KMarkdown 格式
 * KOOK 支持 KMarkdown，所以可以保留部分格式
 */
export const markdownToKMarkdown = (items: DataMarkDown['value'], hideUnsupported?: boolean | number): string => {
  if (Number(hideUnsupported) >= 4) {
    return '';
  }

  return joinMarkdownParts(
    items,
    items.map(item => (mardownMap[item.type] ? mardownMap[item.type](item, hideUnsupported) : ''))
  );
};

/**
 * 将原始 Markdown 字符串转为 KMarkdown
 * KOOK 的 KMarkdown 与标准 Markdown 语法接近，大部分可直接透传
 */
export const markdownRawToKMarkdown = (raw: string, hideUnsupported?: boolean | number): string => {
  if (Number(hideUnsupported) >= 4) {
    return '';
  }

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
  if (Number(hideUnsupported) >= 4) {
    return '';
  }

  switch (item.type) {
    case 'Markdown':
      return markdownToKMarkdown(item.value, hideUnsupported);

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

/** 发送与编辑共用 KMarkdown 正文转换，保留输入顺序。 */
export const formatKookContent = (format: DataEnums[], hideUnsupported?: boolean | number): string => {
  return format
    .map(item => {
      if (item.type === 'Link') {
        return `[${item.value}](${item.options?.link ?? item.value})`;
      }
      if (item.type === 'Mention') {
        if (!item.value || item.value === 'everyone' || item.value === 'all') {
          return '(met)all(met)';
        }
        if (item.options?.belong === 'user') {
          return `(met)${item.value}(met)`;
        }
        if (item.options?.belong === 'channel') {
          return `(chn)${item.value}(chn)`;
        }

        return '';
      }
      if (item.type === 'Text') {
        const wrapMap: Record<string, string> = { block: '`', italic: '*', bold: '**', boldItalic: '***', strikethrough: '~~' };
        const wrap = wrapMap[item.options?.style];

        return wrap ? `${wrap}${item.value}${wrap}` : item.value;
      }
      if (item.type === 'Image' || item.type === 'ImageURL' || item.type === 'ImageFile') {
        return '';
      }

      return dataEnumToKMarkdown(item, hideUnsupported);
    })
    .join('')
    .replace(/^[^\S\n\r]+|[^\S\n\r]+$/g, '');
};
