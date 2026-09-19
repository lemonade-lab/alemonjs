import type { DataMarkDown, DataMarkdownBlockquote } from '../../types/message/markdown.js';

/**
 * 将完整引用块渲染为 Markdown（也可作为纯文本降级）。
 * 子节点由平台递归渲染，保留平台自己的链接、mention 和样式规则。
 * 两侧空行隔离相邻段落；内部空行也必须带引用标记。
 */
export const renderMarkdownBlockquote = (value: DataMarkdownBlockquote['value'], renderChildren: (items: DataMarkDown['value']) => string): string => {
  const content = typeof value === 'string' ? value : renderChildren(value).replace(/^\n+|\n+$/g, '');

  // 显式空引用仍保留；非空子节点全部被过滤后，不再生成空壳。
  if (Array.isArray(value) && value.length > 0 && !content.trim()) {
    return '';
  }
  const quoted = content
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(line => (line ? `> ${line}` : '>'))
    .join('\n');

  return `\n\n${quoted}\n\n`;
};

const blockTypes = new Set(['MD.title', 'MD.subtitle', 'MD.list', 'MD.code', 'MD.divider', 'MD.blockquote']);

/** 块级节点负责隔离相邻正文；行内节点保持直接拼接。 */
export const joinMarkdownParts = (items: readonly { type: string }[], parts: readonly string[]): string => {
  let content = '';

  parts.forEach((part, index) => {
    if (part && blockTypes.has(items[index].type)) {
      content = content.replace(/\n*$/, '\n\n') + part.replace(/^\n+|\n+$/g, '') + '\n\n';
    } else {
      content += part;
    }
  });

  return content;
};

/** 无原生 Markdown 渲染器的平台使用的可读文本降级，递归保留引用内容。 */
export const markdownToPlainText = (items: DataMarkDown['value'], hideUnsupported?: boolean | number): string => {
  if (Number(hideUnsupported) >= 4) {
    return '';
  }

  return joinMarkdownParts(
    items,
    items.map(item => {
      switch (item.type) {
        case 'MD.blockquote':
          return renderMarkdownBlockquote(item.value, children => markdownToPlainText(children, hideUnsupported));
        case 'MD.newline':
          return '\n';
        case 'MD.divider':
          return hideUnsupported ? '' : '\n---\n';
        case 'MD.link':
          if (Number(hideUnsupported) >= 3) {
            return '';
          }
          if (Number(hideUnsupported) >= 2) {
            return item.value.url ?? item.value.text;
          }

          return item.value.url ? `${item.value.text} (${item.value.url})` : item.value.text;
        case 'MD.list':
          return '\n' + item.value.map(li => (typeof li.value === 'string' ? `- ${li.value}` : `${li.value.index}. ${li.value.text ?? ''}`)).join('\n') + '\n';
        case 'MD.image':
          return hideUnsupported ? '' : '[图片]';
        case 'MD.mention':
          return item.value === 'everyone' ? '@所有人' : `@${item.value ?? ''}`;
        case 'MD.button':
          if (Number(hideUnsupported) >= 3) {
            return '';
          }

          return Number(hideUnsupported) >= 2 ? item.options?.data || item.value : item.value;
        default:
          return item.value;
      }
    })
  );
};
