import { createResult, DataEnums, ResultCode } from 'alemonjs';
import { readFileSync } from 'fs';
import { BubbleClient } from './sdk/wss';
import { dataEnumToBubbleText } from './format';
import { getBubbleConfig } from './config';

type Client = typeof BubbleClient.prototype;

const ImageURLToBuffer = async (url: string) => {
  const arrayBuffer = await fetch(url).then(res => res.arrayBuffer());

  return Buffer.from(arrayBuffer);
};

/** 将 Markdown/ButtonGroup 转为 Bubble 原生格式文本 */
const buildBubbleMdContent = (mdAndButtons: DataEnums[]): string => {
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
          'MD.blockquote': value => `\n> ${value}`,
          'MD.newline': () => '\n',
          'MD.link': value => `[🔗${value.text}](${value.url}) `,
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

        md.forEach(line => {
          if (map[line.type]) {
            const value = 'value' in line ? line.value : undefined;
            const options = 'options' in line ? line.options : {};

            contentMd += map[line.type](value, options);

            return;
          }
          if (line.type === 'MD.list') {
            const listStr = line.value.map(listItem => {
              if (typeof listItem.value === 'object') {
                return `\n${listItem.value.index}. ${listItem.value.text}`;
              }

              return `\n- ${listItem.value}`;
            });

            contentMd += `${listStr.join('')}\n`;
          } else if (line.type === 'MD.code') {
            const language = line?.options?.language || '';

            contentMd += `\n\`\`\`${language}\n${line.value}\n\`\`\`\n`;
          } else {
            const value = line['value'] || '';

            contentMd += String(value);
          }
        });
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

export const sendToRoom = async (
  client: Client,
  param: {
    channel_id: string | number | null;
    thread_id?: string | number | null;
    message_id?: string | number | null;
  },
  val: DataEnums[]
) => {
  try {
    if (!val || val.length <= 0) {
      return [];
    }
    const channelId = String(param?.channel_id ?? '');
    const threadId = String(param?.thread_id ?? '');
    const messageId = param?.message_id ? String(param?.message_id) : undefined;
    // images
    const images = val.filter(item => item.type === 'Image' || item.type === 'ImageURL' || item.type === 'ImageFile');
    // markdown
    const mdAndButtons = val.filter(item => item.type === 'Markdown' || item.type === 'BT.group');
    // 降级处理：将不被原生支持的类型转为文本
    const nativeTypes = new Set(['Image', 'ImageURL', 'ImageFile', 'Markdown', 'BT.group', 'Mention', 'Text', 'Link']);
    const unsupportedItems = val.filter(item => !nativeTypes.has(item.type));
    const hide = getBubbleConfig().hideUnsupported;
    const fallbackText = unsupportedItems
      .map(item => dataEnumToBubbleText(item, hide))
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

          return item.value ?? '';
        }

        return '';
      })
      .join('');

    // Markdown/ButtonGroup → Bubble 原生格式，与 Text 合并
    const contentMd = buildBubbleMdContent(mdAndButtons);
    // 合并 Text、Markdown 和降级文本内容
    const finalContent = [content, contentMd, fallbackText]
      .filter(Boolean)
      .join('\n')
      .replace(/^[^\S\n\r]+|[^\S\n\r]+$/g, '');

    // hideUnsupported 模式：检查转换后内容是否为空
    if (hide && !finalContent && images.length <= 0) {
      logger.info('[bubble] hideUnsupported: 消息内容转换后为空，跳过发送');

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
          } else if (item.value.startsWith('http://') || item.value.startsWith('https://')) {
            const res = await ImageURLToBuffer(item.value);

            bufferData = res;
          } else if (item.value.startsWith('base64://')) {
            const base64Str = item.value.slice(9); // 'base64://'.length === 9

            bufferData = Buffer.from(base64Str, 'base64');
          } else if (item.value.startsWith('file://')) {
            bufferData = readFileSync(item.value.slice(7));
          }
        } else if (item.type === 'ImageURL') {
          const res = await ImageURLToBuffer(item.value);

          bufferData = res;
        } else if (item.type === 'ImageFile') {
          bufferData = readFileSync(item.value);
        }
      }

      const uploadRes = await client.uploadFile(bufferData, undefined, { channelId, threadId, messageId: messageId });

      const fileAttachment = uploadRes?.data?.file;

      if (!fileAttachment) {
        return [createResult(ResultCode.Ok, '文件上传失败：未返回文件信息', uploadRes)];
      }

      if (channelId) {
        const res = await client.sendMessage(channelId, {
          content: finalContent,
          type: 'image',
          attachments: [fileAttachment]
        });

        return [createResult(ResultCode.Ok, '完成', res)];
      }

      if (threadId) {
        const res = await client.sendDm(threadId, {
          content: finalContent,
          type: 'image',
          attachments: [fileAttachment]
        });

        return [createResult(ResultCode.Ok, '完成', res)];
      }

      return [createResult(ResultCode.Ok, '完成', null)];
    }

    if (finalContent && finalContent.length > 0) {
      if (channelId) {
        const res = await client.sendMessage(channelId, { content: finalContent, type: 'text' });

        return [createResult(ResultCode.Ok, '完成', res)];
      }

      if (threadId) {
        const res = await client.sendDm(threadId, { content: finalContent, type: 'text' });

        return [createResult(ResultCode.Ok, '完成', res)];
      }

      return [createResult(ResultCode.Ok, '完成', null)];
    }

    return [];
  } catch (err) {
    return [createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)];
  }
};

export const sendToUser = async (
  client: Client,
  param: {
    author_id?: string | number;
    channel_id?: string | number;
    thread_id?: string | number;
    message_id?: string | number;
  },
  val: DataEnums[]
) => {
  if (!val || val.length <= 0) {
    return [];
  }

  let threadId: string | number | undefined = param?.channel_id || param?.thread_id;
  const messageId = param?.message_id;

  if (!threadId && param.author_id) {
    const dm = await client.getOrCreateDm(param.author_id);

    threadId = dm?.id;
  }

  if (!threadId) {
    return [];
  }

  return sendToRoom(client, { channel_id: null, thread_id: threadId, message_id: messageId }, val);
};

export default {};
