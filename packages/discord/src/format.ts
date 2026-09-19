import { joinMarkdownParts, renderMarkdownBlockquote } from 'alemonjs/markdown';
import type { DataEnums, DataMarkDown } from 'alemonjs';

/**
 * 将结构化 Markdown 子元素数组转为 Discord Markdown 格式
 * Discord 原生支持 Markdown, 可直接保留格式
 */
export const markdownToDiscordText = (items: DataMarkDown['value'], hideUnsupported?: boolean | number): string => {
  if (Number(hideUnsupported) >= 4) {
    return '';
  }

  return joinMarkdownParts(
    items,
    items.map(item => {
      switch (item.type) {
        case 'MD.text':
          return item.value;
        case 'MD.title':
          return `# ${item.value}\n`;
        case 'MD.subtitle':
          return `## ${item.value}\n`;
        case 'MD.bold':
          return `**${item.value}**`;
        case 'MD.italic':
        case 'MD.italicStar':
          return `*${item.value}*`;
        case 'MD.strikethrough':
          return `~~${item.value}~~`;
        case 'MD.link': {
          const v = item.value as unknown as { text: string; url?: string };

          if (Number(hideUnsupported) >= 3) {
            return '';
          }

          if (!v.url) {
            return v.text;
          }

          return Number(hideUnsupported) >= 2 ? v.url : `[${v.text}](${v.url})`;
        }
        case 'MD.image':
          return `[image](${item.value})`;
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
          return renderMarkdownBlockquote(item.value, children => markdownToDiscordText(children, hideUnsupported));
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
            return '@everyone';
          }

          return `<@${item.value ?? ''}>`;
        case 'MD.content':
          return item.value;
        case 'MD.button':
          if (Number(hideUnsupported) >= 3) {
            return '';
          }
          if (Number(hideUnsupported) >= 2) {
            return (item as any).options?.data || String(item.value);
          }

          return item.value;
        default:
          return String((item as any)?.value ?? '');
      }
    })
  );
};

/**
 * 将原始 Markdown 字符串转为 Discord 兼容文本
 * Discord 原生支持大部分标准 Markdown，仅去除不支持的图片语法
 */
export const markdownRawToDiscordText = (raw: string, hideUnsupported?: boolean | number): string => {
  if (Number(hideUnsupported) >= 4) {
    return '';
  }

  let text = raw;

  // Discord 不支持 ![alt](url) 内嵌图片，转为链接或隐藏
  text = text.replace(/!\[([^\]]*)\]\(([^)]*)\)/g, hideUnsupported ? '' : '[$1]($2)');

  return text;
};

/**
 * 将 DataEnums 数组中不被原生处理的类型降级为 Discord 可用文本
 *
 * discord 原生支持: Text, Mention, Link, Image, ImageFile, ImageURL, Markdown, BT.group
 * 其余类型降级为文本
 */
export const dataEnumToDiscordText = (item: DataEnums, hideUnsupported?: boolean | number): string => {
  if (Number(hideUnsupported) >= 4) {
    return '';
  }

  switch (item.type) {
    case 'MarkdownOriginal':
      return markdownRawToDiscordText(String(item.value), hideUnsupported);

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

/** 将 Text / Mention / Link 项转为 Discord 文本 */
const formatTextItem = (item: DataEnums): string => {
  if (item.type === 'Link') {
    return `[${item.value}](${item?.options?.link ?? item.value})`;
  }
  if (item.type === 'Mention') {
    if (item.options?.belong === 'everyone' || item.value === 'everyone' || item.value === 'all' || item.value === '' || typeof item.value !== 'string') {
      return '<@everyone>';
    }
    if (item.options?.belong === 'user') {
      return `<@${item.value}>`;
    }
    if (item.options?.belong === 'channel') {
      return `<#${item.value}>`;
    }

    return '';
  }
  if (item.type === 'Text') {
    const wrapMap: Record<string, string> = { block: '`', italic: '*', bold: '**', boldItalic: '***', strikethrough: '~~' };
    const wrap = wrapMap[item.options?.style];

    return wrap ? `${wrap}${item.value}${wrap}` : item.value;
  }

  return '';
};

/** 发送与编辑共用正文渲染，图片及交互组件由发送层单独处理。 */
export const formatDiscordContent = (format: DataEnums[], hideUnsupported?: boolean | number): string => {
  return format
    .map(item => {
      switch (item.type) {
        case 'Markdown':
          return markdownToDiscordText(item.value, hideUnsupported);
        case 'MarkdownOriginal': {
          const text = markdownRawToDiscordText(item.value, hideUnsupported);
          return text ? `\n\n${text}\n\n` : '';
        }
        case 'Text':
        case 'Mention':
        case 'Link':
          return formatTextItem(item);
        case 'Image':
        case 'ImageURL':
        case 'ImageFile':
        case 'BT.group':
        case 'ButtonGroup':
        case 'Select':
        case 'Embed':
          return '';
        default:
          return dataEnumToDiscordText(item, hideUnsupported);
      }
    })
    .join('')
    .replace(/^[^\S\n\r]+|[^\S\n\r]+$/g, '');
};
