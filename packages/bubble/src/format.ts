import { joinMarkdownParts, renderMarkdownBlockquote } from 'alemonjs/markdown';
import type { DataEnums, DataMarkDown } from 'alemonjs';

/** 最终正文按输入顺序组合，媒体仍由发送层处理。 */
export const formatBubbleContent = (items: DataEnums[], hideUnsupported?: boolean | number): string => {
  return items
    .map(item => {
      if (item.type === 'Markdown' || item.type === 'BT.group') {
        return buildBubbleMdContent([item]);
      }
      if (item.type === 'Text') {
        const wraps: Record<string, string> = { block: '`', italic: '*', bold: '**', strikethrough: '~~' };
        const wrap = wraps[item.options?.style];
        return wrap ? `${wrap}${item.value}${wrap}` : item.value;
      }
      if (item.type === 'Link') {
        return `[${item.value}](${item.options?.link ?? item.value})`;
      }
      if (item.type === 'Mention') {
        if (!item.value || item.value === 'everyone' || item.value === 'all') return '<@everyone>';
        if (item.options?.belong === 'user') return `<@${item.value}>`;
        if (item.options?.belong === 'channel') return `<#${item.value}>`;
        return '';
      }
      if (item.type === 'Image' || item.type === 'ImageFile' || item.type === 'ImageURL') return '';
      const fallback = dataEnumToBubbleText(item, hideUnsupported);
      return fallback ? `\n\n${fallback}\n\n` : '';
    })
    .join('');
};

/**
 * 将结构化 Markdown 子元素数组转为 Bubble 兼容的 Markdown 文本
 */
export const markdownToBubbleText = (items: DataMarkDown['value'], hideUnsupported?: boolean | number): string => {
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
          return renderMarkdownBlockquote(item.value, children => markdownToBubbleText(children, hideUnsupported));
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
          if (Number(hideUnsupported) >= 3) {
            return '';
          }
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
  );
};

/**
 * 将原始 Markdown 字符串转为 Bubble 兼容文本
 * Bubble 支持 Markdown，大部分可直接透传
 */
export const markdownRawToBubbleText = (raw: string, hideUnsupported?: boolean | number): string => {
  if (Number(hideUnsupported) >= 4) {
    return '';
  }
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
  if (Number(hideUnsupported) >= 4) {
    return '';
  }

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

/** 将 Markdown/ButtonGroup 转为 Bubble 原生格式文本 */
export const buildBubbleMdContent = (mdAndButtons: DataEnums[]): string => {
  let contentMd = '';

  if (mdAndButtons && mdAndButtons.length > 0) {
    mdAndButtons.forEach(item => {
      if (item.type === 'Markdown' && typeof item.value !== 'string') {
        const md = item.value;

        const map: {
          [key: string]: (value: any, options?: any) => string;
        } = {
          'MD.title': value => `# ${value}`,
          'MD.subtitle': value => `## ${value}`,
          'MD.text': value => `${value} `,
          'MD.bold': value => `**${value}** `,
          'MD.divider': () => '\n————————\n',
          'MD.italic': value => `_${value}_ `,
          'MD.italicStar': value => `*${value}* `,
          'MD.strikethrough': value => `~~${value}~~ `,
          'MD.blockquote': value => renderMarkdownBlockquote(value, children => buildBubbleMdContent([{ type: 'Markdown', value: children }])),
          'MD.newline': () => '\n',
          'MD.link': value => (value.url ? `[🔗${value.text}](${value.url}) ` : `${value.text} `),
          'MD.image': value => `\n![${value}](${value})\n`,
          'MD.mention': (value, options) => {
            const { belong } = options || {};

            if (value === 'everyone' || value === 'all' || value === '' || typeof value !== 'string') {
              return '<@everyone> ';
            }
            if (belong === 'user') {
              return `<@${value}> `;
            } else if (belong === 'channel') {
              return `<#${value}> `;
            }

            return '';
          },
          'MD.button': (value, options) => {
            const autoEnter = options?.autoEnter ?? false;
            const label = typeof value === 'object' ? value.title : value;
            const command = options?.data || label;

            return `<btn variant="borderless" command="${command}" enter="${String(autoEnter)}" >${label}</btn> `;
          },
          'MD.content': value => `${value}`
        };

        const parts = md.map(line => {
          if (map[line.type]) {
            const value = 'value' in line ? line.value : undefined;
            const options = 'options' in line ? line.options : {};

            return map[line.type](value, options);
          }
          if (line.type === 'MD.list') {
            const listStr = line.value.map(listItem => {
              if (typeof listItem.value === 'object') {
                return `\n${listItem.value.index}. ${listItem.value.text}`;
              }

              return `\n- ${listItem.value}`;
            });

            return `${listStr.join('')}\n`;
          } else if (line.type === 'MD.code') {
            const language = line?.options?.language || '';

            return `\n\`\`\`${language}\n${line.value}\n\`\`\`\n`;
          } else {
            const value = line['value'] || '';

            return String(value);
          }
        });
        contentMd += joinMarkdownParts(md, parts);
      } else if (item.type === 'BT.group' && item.value.length > 0 && typeof item.value !== 'string') {
        contentMd += `<box  classWind="mt-2" variant="borderless" >${item.value
          ?.map(row => {
            const val = row.value;

            if (val.length === 0) {
              return '';
            }

            return `<flex>${val
              .map(button => {
                const value = button?.value || {};
                const options = button.options;
                const autoEnter = options?.autoEnter ?? false;
                const label = value;
                const command = options?.data || label;

                return `<btn command="${command}" enter="${String(autoEnter)}" >${label}</btn>`;
              })
              .join('')}</flex>`;
          })
          .join('')}</box>`;
      }
    });
  }

  return contentMd;
};
