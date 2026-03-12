import type { DataEnums, DataMarkDown } from 'alemonjs';

/**
 * 将结构化 Markdown 子元素数组转为可读纯文本
 */
export const markdownToText = (items: DataMarkDown['value']): string => {
  return items
    .map(item => {
      switch (item.type) {
        case 'MD.text':
          return item.value;
        case 'MD.title':
          return `【${item.value}】\n`;
        case 'MD.subtitle':
          return `〖${item.value}〗\n`;
        case 'MD.bold':
        case 'MD.italic':
        case 'MD.italicStar':
        case 'MD.strikethrough':
          return item.value;
        case 'MD.link': {
          const v = item.value as unknown as { text: string; url: string };

          return `${v.text}( ${v.url} )`;
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
        case 'MD.code':
          return item.value;
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
 * 将原始 Markdown 字符串转为可读纯文本
 */
export const markdownRawToText = (raw: string): string => {
  let text = raw;

  // 图片 ![alt](url) → [图片]
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, '[图片]');
  // 链接 [text](url) → text
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  // 标题
  text = text.replace(/^#{1,6}\s+/gm, '');
  // 粗斜体
  text = text.replace(/(\*{3}|_{3})([^*_]+)\1/g, '$2');
  // 粗体
  text = text.replace(/(\*{2}|_{2})([^*_]+)\1/g, '$2');
  // 斜体
  text = text.replace(/(?<!\*)\*(?!\*)([^*]+)(?<!\*)\*(?!\*)/g, '$1');
  text = text.replace(/(?<!_)_(?!_)([^_]+)(?<!_)_(?!_)/g, '$1');
  // 删除线
  text = text.replace(/~~([^~]+)~~/g, '$1');
  // 行内代码
  text = text.replace(/`([^`]+)`/g, '$1');
  // 代码块
  text = text.replace(/```[\s\S]*?```/g, match => {
    return match.replace(/```\w*\n?/g, '').trim();
  });
  // 引用
  text = text.replace(/^>\s+/gm, '');
  // 分割线
  text = text.replace(/^[-*_]{3,}\s*$/gm, '————————');
  // 无序列表
  text = text.replace(/^[\s]*[-*+]\s+/gm, '· ');
  // 有序列表
  text = text.replace(/^[\s]*(\d+)\.\s+/gm, '$1. ');

  return text.trim();
};

/**
 * 将 DataEnums 数组中不被原生支持的类型降级为纯文本
 *
 * onebot 原生支持: Text, Mention, Image, ImageFile, ImageURL
 * 其余类型（Markdown, MarkdownOriginal, Button, Ark, Link 等）降级为可读文本
 */
export const dataEnumToText = (item: DataEnums): string => {
  switch (item.type) {
    case 'Link':
      if ((item as any).options?.link) {
        return `${item.value}( ${(item as any).options.link} )`;
      }

      return String(item.value);

    case 'Markdown':
      return markdownToText((item as any).value);

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
