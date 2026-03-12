import type { DataEnums, DataMarkDown } from 'alemonjs';

/**
 * 将结构化 Markdown 子元素数组转为可读纯文本
 */
export const markdownToText = (items: DataMarkDown['value'], hideUnsupported?: boolean | number): string => {
  if (Number(hideUnsupported) >= 4) return '';

  return items
    .map(item => {
      switch (item.type) {
        case 'MD.text':
          return item.value;
        case 'MD.title':
          return hideUnsupported ? `${item.value}\n` : `【${item.value}】\n`;
        case 'MD.subtitle':
          return hideUnsupported ? `${item.value}\n` : `〖${item.value}〗\n`;
        case 'MD.bold':
        case 'MD.italic':
        case 'MD.italicStar':
        case 'MD.strikethrough':
          return item.value;
        case 'MD.link': {
          const v = item.value as unknown as { text: string; url: string };

          if (Number(hideUnsupported) >= 3) return '';

          return Number(hideUnsupported) >= 2 ? v.url : `${v.text}( ${v.url} )`;
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

                return `· ${li.value}`;
              })
              .join('\n') + '\n'
          );
        case 'MD.blockquote':
          return `> ${item.value}\n`;
        case 'MD.divider':
          return hideUnsupported ? '' : '————————\n';
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
 * 将按钮组转为可读纯文本
 */
export const buttonsToText = (rows: any[]): string => {
  return rows.map((row: any) => row.value.map((btn: any) => `[${btn.value}]`).join(' ')).join('\n');
};

/**
 * 将原始 Markdown 字符串转为可读纯文本
 * QQ Bot 不支持原始 Markdown 直接渲染，需要降级
 */
export const markdownRawToText = (raw: string, hideUnsupported?: boolean | number): string => {
  if (Number(hideUnsupported) >= 4) return '';

  let text = raw;

  // 图片 ![alt](url) → [图片] 或隐藏
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, hideUnsupported ? '' : '[图片]');
  // 链接 [text](url) → text 或 url（二级）
  text = text.replace(/\[([^\]]*)\]\(([^)]*)\)/g, Number(hideUnsupported) >= 2 ? '$2' : '$1');
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
  text = text.replace(/^[-*_]{3,}\s*$/gm, hideUnsupported ? '' : '————————');
  // 无序列表
  text = text.replace(/^[\s]*[-*+]\s+/gm, '· ');
  // 有序列表
  text = text.replace(/^[\s]*(\d+)\.\s+/gm, '$1. ');

  return text.trim();
};

/**
 * 将 DataEnums 数组中不被原生处理的类型降级为文本
 *
 * qq-bot 原生支持: Text, Mention, Link, Image, ImageFile, ImageURL,
 *                  Markdown, BT.group
 * qq-bot 内部扩展: ButtonTemplate, Ark.list, Ark.Card, Ark.BigCard
 * 其余类型降级为文本
 */
export const dataEnumToText = (item: DataEnums, hideUnsupported?: boolean | number): string => {
  if (Number(hideUnsupported) >= 4) return '';

  switch (item.type) {
    case 'MarkdownOriginal':
      return markdownRawToText(String(item.value), hideUnsupported);

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
