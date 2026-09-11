export const markdownToText = (md: any[]): string => {
  if (!Array.isArray(md)) {
    return String(md || '');
  }

  return md
    .map(item => {
      if (!item) {
        return '';
      }

      switch (item.type) {
        case 'MD.title':
          return `# ${item.value} `;
        case 'MD.subtitle':
          return `## ${item.value} `;
        case 'MD.text':
          return `${item.value} `;
        case 'MD.bold':
          return `**${item.value}** `;
        case 'MD.divider':
          return '\n---\n';
        case 'MD.italic':
          return `*${item.value}* `;
        case 'MD.strikethrough':
          return `~~${item.value}~~ `;
        case 'MD.blockquote':
          return `\n> ${item.value} `;
        case 'MD.newline':
          return '\n';
        case 'MD.link':
          if (!item.value?.text && !item.value?.url) {
            return '';
          }
          if (!item.value?.text || !item.value?.url) {
            return `<${item.value?.url || item.value?.text}> `;
          }

          return `[${item.value.text}](${item.value.url}) `;
        case 'MD.image':
          return `\n[图片: ${item.value}]\n`;
        case 'MD.mention':
          if (item.value === 'everyone') {
            return '@所有人';
          }

          return `@${item.value} `;
        case 'MD.content':
          return String(item.value || '');
        case 'MD.list':
          if (Array.isArray(item.value)) {
            return item.value
              .map((li: any, i: number) => {
                const text = typeof li.value === 'object' ? li.value.text : li.value;

                return `\n${i + 1}. ${text}`;
              })
              .join('');
          }

          return `\n- ${item.value}`;
        case 'MD.code':
          const lang = item.options?.language || '';

          return `\n\`\`\`${lang}\n${item.value}\n\`\`\`\n`;
        default:
          return String(item.value || '');
      }
    })
    .join('');
};

export const dataEnumToText = (item: any, hide?: boolean): string => {
  if (!item) {
    return '';
  }

  switch (item.type) {
    case 'Text':
      return item.value || '';
    case 'Markdown':
      if (typeof item.value === 'string') {
        return item.value;
      }
      if (Array.isArray(item.value)) {
        return markdownToText(item.value);
      }

      return '';
    case 'MarkdownOriginal':
      return item.value || '';
    case 'Image':
    case 'ImageFile':
    case 'ImageURL':
      return '[图片]';
    case 'Audio':
      return '[语音]';
    case 'Video':
      return '[视频]';
    case 'Attachment':
      return `[文件: ${item.options?.filename || '未知'}]`;
    case 'Mention':
      if (item.value === 'everyone' || item.value === 'all') {
        return '@所有人';
      }

      return `@${item.value}`;
    case 'Link':
      if (item.options?.link) {
        return `[${item.value}](${item.options.link})`;
      }

      return item.value || '';
    default:
      if (hide) {
        return '';
      }

      return `[${item.type}]`;
  }
};
