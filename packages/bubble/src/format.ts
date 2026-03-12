import type { DataEnums, DataMarkDown } from 'alemonjs';

/**
 * 将结构化 Markdown 子元素数组转为 Bubble 兼容的 Markdown 文本
 */
export const markdownToBubbleText = (items: DataMarkDown['value'], hideUnsupported?: boolean | number): string => {
  if (Number(hideUnsupported) >= 4) return '';

  return items
    .map(item => {
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
          const v = item.value as unknown as { text: string; url: string };

          if (Number(hideUnsupported) >= 3) return '';

          return Number(hideUnsupported) >= 2 ? v.url : `[${v.text}](${v.url})`;
        }
        case 'MD.image':
          return `![image](${item.value})`;
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
          return '\n————————\n';
        case 'MD.newline':
          return '\n';
        case 'MD.code': {
          const lang = item?.options?.language || '';

          return `\`\`\`${lang}\n${item.value}\n\`\`\`\n`;
        }
        case 'MD.mention':
          if (item.value === 'everyone') {
            return '<@everyone>';
          }

          return `<@${item.value ?? ''}>`;
        case 'MD.content':
          return item.value;
        case 'MD.button': {
          if (Number(hideUnsupported) >= 3) return '';
          if (Number(hideUnsupported) >= 2) {
            const btnData = (item as any).options?.data || (typeof item.value === 'object' ? (item.value as any).title : item.value);

            return String(btnData);
          }

          const options = item?.options;
          const autoEnter = options?.autoEnter ?? false;
          const label = typeof item.value === 'object' ? (item.value as any).title : item.value;
          const command = options?.data || label;

          return `<btn variant="borderless" command="${command}" enter="${String(autoEnter)}" >${label}</btn> `;
        }
        default:
          return String((item as any)?.value ?? '');
      }
    })
    .join('');
};

/**
 * 将原始 Markdown 字符串转为 Bubble 兼容文本
 * Bubble 支持 Markdown，大部分可直接透传
 */
export const markdownRawToBubbleText = (raw: string, hideUnsupported?: boolean | number): string => {
  if (Number(hideUnsupported) >= 4) return '';
  if (hideUnsupported) {
    // 隐藏不可阅读信息：图片
    return raw.replace(/!\[([^\]]*)\]\([^)]*\)/g, '');
  }

  return raw;
};

/**
 * 将 DataEnums 数组中不被原生处理的类型降级为 Bubble 可用文本
 *
 * bubble 原生支持: Text, Mention, Link, Image, ImageFile, ImageURL, Markdown, BT.group
 * 其余类型降级为文本
 */
export const dataEnumToBubbleText = (item: DataEnums, hideUnsupported?: boolean | number): string => {
  if (Number(hideUnsupported) >= 4) return '';

  switch (item.type) {
    case 'MarkdownOriginal':
      return markdownRawToBubbleText(String(item.value), hideUnsupported);

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
