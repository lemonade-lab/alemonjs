import { joinMarkdownParts, renderMarkdownBlockquote } from 'alemonjs/markdown';
import type { DataEnums, DataMarkDown } from 'alemonjs';

/** 群聊、私聊和频道共用有序正文；提及等原生文本由发送上下文提供。 */
export const formatQQContent = (items: DataEnums[], renderNative: (item: DataEnums) => string, plain = false, hideUnsupported?: boolean | number): string => {
  return items
    .map(item => {
      if (item.type === 'Markdown') {
        return plain ? markdownToText(item.value, hideUnsupported) : createMarkdownText(item.value);
      }
      if (item.type === 'MarkdownOriginal') {
        const text = plain ? markdownRawToText(item.value, hideUnsupported) : item.value;
        return text ? `\n\n${text}\n\n` : '';
      }
      if (item.type === 'BT.group') {
        if (!plain || Number(hideUnsupported) >= 4) return '';
        const text = item.value
          .map(row =>
            row.value
              .map(button => {
                if (Number(hideUnsupported) >= 3) return '';
                if (Number(hideUnsupported) >= 2) return button.options?.data || button.value;
                return hideUnsupported ? button.value : `[${button.value}]`;
              })
              .filter(Boolean)
              .join(' ')
          )
          .filter(Boolean)
          .join('\n');
        return text ? `\n\n${text}\n\n` : '';
      }
      return renderNative(item);
    })
    .join('');
};

/**
 * 将结构化 Markdown 子元素数组转为可读纯文本
 */
export const markdownToText = (items: DataMarkDown['value'], hideUnsupported?: boolean | number): string => {
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
          return hideUnsupported ? `${item.value}\n` : `【${item.value}】\n`;
        case 'MD.subtitle':
          return hideUnsupported ? `${item.value}\n` : `〖${item.value}〗\n`;
        case 'MD.bold':
        case 'MD.italic':
        case 'MD.italicStar':
        case 'MD.strikethrough':
          return item.value;
        case 'MD.link': {
          const v = item.value as unknown as { text: string; url?: string };

          if (Number(hideUnsupported) >= 3) {
            return '';
          }

          if (!v.url) {
            return v.text;
          }

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
          return renderMarkdownBlockquote(item.value, children => markdownToText(children, hideUnsupported));
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
          if (Number(hideUnsupported) >= 3) {
            return '';
          }
          if (Number(hideUnsupported) >= 2) {
            return (item as any).options?.data || String(item.value);
          }

          return hideUnsupported ? String(item.value) : `[${item.value}]`;
        default:
          return String((item as any)?.value ?? '');
      }
    })
  );
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
  if (Number(hideUnsupported) >= 4) {
    return '';
  }

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

  return text;
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
  if (Number(hideUnsupported) >= 4) {
    return '';
  }

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

const mdFormatters: Record<string, (value: any, options?: any) => string> = {
  'MD.title': value => `# ${value} `,
  'MD.subtitle': value => `## ${value} `,
  'MD.text': value => `${value} `,
  'MD.bold': value => `**${value}** `,
  'MD.divider': () => '\n***\n',
  'MD.italic': value => `__${value}__ `,
  'MD.italicStar': value => `*${value}* `,
  'MD.strikethrough': value => `~~${value}~~ `,
  'MD.blockquote': value => renderMarkdownBlockquote(value, createMarkdownText),
  'MD.newline': () => '\n',
  'MD.link': value => {
    if (!value?.text && !value?.url) {
      return '';
    }
    if (!value?.text || !value?.url) {
      return `<${value?.url ?? value?.text}> `;
    }

    return `[🔗${value?.text}](${value?.url}) `;
  },
  'MD.image': (value, options) => `\n![text #${options?.width || 208}px #${options?.height || 320}px](${value})\n`,
  'MD.mention': (value, options) => {
    const { belong } = options || {};

    if (belong === 'channel') {
      return '';
    }
    if (value === 'everyone') {
      return '<qqbot-at-everyone />';
    }
    if (belong === 'user') {
      return `<qqbot-at-user id="${value}" />`;
    }

    return `<qqbot-at-user id="${value}" />`;
  },
  'MD.content': value => `${value}`,
  'MD.button': (title, options) => {
    // 得到要发送的文本
    const { data, autoEnter } = options || {};

    if (autoEnter) {
      return `<qqbot-cmd-enter text="${data}" show="${title}" />`;
    }

    return `<qqbot-cmd-input text="${data}" show="${title}" />`;
  }
};

export const createMarkdownText = (data: DataMarkDown['value']): string => {
  return joinMarkdownParts(
    data,
    data.map(mdItem => {
      if (mdFormatters[mdItem.type]) {
        return mdFormatters[mdItem.type]((mdItem as any)?.value, (mdItem as any)?.options);
      }
      if (mdItem.type === 'MD.list' && typeof mdItem.value !== 'string') {
        const listStr = mdItem.value.map(listItem => {
          return typeof listItem.value === 'object' ? `\n${listItem.value.index}. ${listItem.value.text}` : `\n- ${listItem.value}`;
        });

        return `${listStr.join('')}\n`;
      }
      if (mdItem.type === 'MD.code') {
        const language = mdItem?.options?.language || '';

        return `\n\`\`\`${language}\n${mdItem.value}\n\`\`\`\n`;
      }

      return String(mdItem['value'] || '');
    })
  );
};
