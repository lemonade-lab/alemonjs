import { DataButtonRow, createResult, DataEnums, ResultCode } from 'alemonjs';
import { readFileSync } from 'fs';
import { DCClient } from './sdk/wss';
import { dataEnumToDiscordText } from './format';
import { getDiscordConfig } from './config';

type Client = typeof DCClient.prototype;

const ImageURLToBuffer = async (url: string) => {
  const arrayBuffer = await fetch(url).then(res => res.arrayBuffer());

  return Buffer.from(arrayBuffer);
};

const createButtonsData = (rows: DataButtonRow[]) => {
  return rows.map(row => {
    const val = row.value;

    return {
      type: 1,
      components: val.map(button => {
        const value = button.value;
        const text = button.options?.data ?? '';

        return {
          type: 2,
          custom_id: text,
          style: 1,
          label: value
        };
      })
    };
  });
};

const mapToMarkdown = {
  'MD.text': (item: { value: string }) => item.value,
  'MD.blockquote': (item: { value: string }) => `> ${item.value}\n`,
  'MD.bold': (item: { value: string }) => `**${item.value}**`,
  'MD.italic': (item: { value: string }) => `*${item.value}*`,
  'MD.divider': () => '---\n',
  'MD.image': (item: { value: string }) => `![${item.value}](${item.value})`,
  'MD.italicStar': (item: { value: string }) => `*${item.value}*`,
  'MD.link': (item: { value: { text: string; url: string } }) => `[${item.value.text}](${item.value.url})`,
  'MD.newline': () => '\n',
  'MD.strikethrough': (item: { value: string }) => `~~${item.value}~~`,
  'MD.subtitle': (item: { value: string }) => `## ${item.value}\n`,
  'MD.title': (item: { value: string }) => `# ${item.value}\n`,
  'MD.code': (item: { value: string; options?: { language?: string } }) => `\`\`\`${item.options?.language ?? ''}\n${item.value}\n\`\`\`\n`,
  'MD.list': (item: { value: any }) => {
    const listStr = item.value.map(listItem => {
      if (typeof listItem.value === 'object') {
        return `\n${listItem.value.index}. ${listItem.value.text}`;
      }

      return `\n- ${listItem.value}`;
    });

    return `${listStr.join('')}\n`;
  },
  'MD.mention': (item: { value: string; options?: { belong?: string } }) => {
    const { value, options } = item;

    if (value === 'everyone' || value === 'all' || value === '' || typeof value !== 'string') {
      return '<@everyone>';
    }
    if (options?.belong === 'user') {
      return `<@${value}>`;
    } else if (options?.belong === 'channel') {
      return `<#${value}>`;
    }

    return '';
  },
  'MD.content': (item: { value: string }) => item.value,
  'MD.button': (item: { value: string; options: { data: string } }) => {
    // const { value, options } = item || {};
    // const { data } = options || {};

    // return `[${value}](${data})`;
    const { value } = item || {};

    return value;
  }
};

/** 将结构化 Markdown 转为 Discord 原生 Markdown 文本 */
const buildDiscordMdContent = (mds: DataEnums[]): string => {
  let contentMd = '';

  if (mds && mds.length > 0) {
    mds.forEach(item => {
      if (item.type === 'Markdown') {
        const md = item.value;

        md.forEach(line => {
          if (mapToMarkdown[line.type]) {
            contentMd += mapToMarkdown[line.type](line as any);
          }
        });
      }
    });
  }

  return contentMd;
};

export const sendchannel = async (
  client: Client,
  param: {
    channel_id: string;
  },
  val: DataEnums[]
) => {
  try {
    if (!val || val.length <= 0) {
      return [];
    }
    const channelId = param?.channel_id ?? '';
    // images
    const images = val.filter(item => item.type === 'Image' || item.type === 'ImageURL' || item.type === 'ImageFile');
    // buttons
    const buttons = val.filter(item => item.type === 'BT.group');
    // markdown
    const mds = val.filter(item => item.type === 'Markdown');
    // 降级处理：将不被原生支持的类型转为文本
    const nativeTypes = new Set(['Image', 'ImageURL', 'ImageFile', 'BT.group', 'Markdown', 'Mention', 'Text', 'Link']);
    const unsupportedItems = val.filter(item => !nativeTypes.has(item.type));
    const hide = getDiscordConfig().hideUnsupported;
    const fallbackText = unsupportedItems
      .map(item => dataEnumToDiscordText(item, hide))
      .filter(Boolean)
      .join('\n');
    // text
    const content = val
      .filter(item => item.type === 'Mention' || item.type === 'Text' || item.type === 'Link')
      .map(item => {
        if (item.type === 'Link') {
          return `[${item.value}](${item?.options?.link ?? item.value})`;
        } else if (item.type === 'Mention') {
          if (item.value === 'everyone' || item.value === 'all' || item.value === '' || typeof item.value !== 'string') {
            return '<@everyone>';
          }
          if (item.options?.belong === 'user') {
            return `<@${item.value}>`;
          } else if (item.options?.belong === 'channel') {
            return `<#${item.value}>`;
          }

          return '';
        } else if (item.type === 'Text') {
          if (item.options?.style === 'block') {
            return `\`${item.value}\``;
          } else if (item.options?.style === 'italic') {
            return `*${item.value}*`;
          } else if (item.options?.style === 'bold') {
            return `**${item.value}**`;
          } else if (item.options?.style === 'strikethrough') {
            return `~~${item.value}~~`;
          }

          return item.value;
        }
      })
      .join('');

    // Markdown → Discord 原生格式，与 Text 合并
    const contentMd = buildDiscordMdContent(mds);
    // 合并 Text、Markdown 和降级文本内容
    const finalContent = [content, contentMd, fallbackText]
      .filter(Boolean)
      .join('\n')
      .replace(/^[^\S\n\r]+|[^\S\n\r]+$/g, '');

    // hideUnsupported 模式：检查转换后内容是否为空
    if (hide && !finalContent && images.length <= 0 && buttons.length <= 0) {
      logger.info('[discord] hideUnsupported: 消息内容转换后为空，跳过发送');

      return [];
    }

    if (images.length > 0) {
      let bufferData = null;

      for (let i = 0; i < images.length; i++) {
        if (bufferData) {
          break;
        }
        const item = images[i];

        if (item.type === 'Image') {
          if (Buffer.isBuffer(item.value)) {
            bufferData = item.value;
          } else if (typeof item.value === 'string') {
            if (item.value.startsWith('http://') || item.value.startsWith('https://')) {
              bufferData = await ImageURLToBuffer(item.value);
            } else if (item.value.startsWith('base64://')) {
              bufferData = Buffer.from(item.value.slice(9), 'base64');
            } else if (item.value.startsWith('file://')) {
              bufferData = readFileSync(item.value.slice(7));
            } else {
              bufferData = Buffer.from(item.value, 'base64');
            }
          }
        } else if (item.type === 'ImageURL') {
          const res = await ImageURLToBuffer(item.value);

          bufferData = res;
        } else if (item.type === 'ImageFile') {
          bufferData = readFileSync(item.value);
        }
      }
      const res = await client.channelsMessagesForm(
        channelId,
        {
          content: finalContent
        },
        bufferData
      );

      return [createResult(ResultCode.Ok, '完成', res)];
    }

    if (buttons && buttons.length > 0) {
      let components = null;

      buttons.forEach(item => {
        if (components) {
          return;
        }
        const rows = item.value;

        if (typeof rows === 'string') {
          return;
        }
        // 构造成按钮
        components = createButtonsData(rows as DataButtonRow[]);
      });
      const res = await client.channelsMessages(channelId, {
        content: finalContent,
        components: components
      });

      return [createResult(ResultCode.Ok, '完成', res)];
    }
    if (finalContent) {
      const res = await client.channelsMessagesForm(channelId, {
        content: finalContent
      });

      return [createResult(ResultCode.Ok, '完成', res)];
    }

    return [];
  } catch (err) {
    return [createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)];
  }
};

export const senduser = async (
  client: Client,
  param: {
    author_id?: string;
    channel_id?: string;
  },
  val: DataEnums[]
) => {
  if (!val || val.length <= 0) {
    return [];
  }
  const channelId = param?.channel_id ?? (await client.userMeChannels(param.author_id))?.id;

  return sendchannel(client, { channel_id: channelId }, val);
};
