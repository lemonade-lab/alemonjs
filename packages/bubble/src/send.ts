import { createResult, DataEnums, ResultCode } from 'alemonjs';
import { readFileSync } from 'fs';
import { BubbleClient } from './sdk/wss';

type Client = typeof BubbleClient.prototype;

const ImageURLToBuffer = async (url: string) => {
  const arrayBuffer = await fetch(url).then(res => res.arrayBuffer());

  return Buffer.from(arrayBuffer);
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

    if (images.length > 0) {
      let bufferData = null;

      for (let i = 0; i < images.length; i++) {
        if (bufferData) {
          break;
        }
        const item = images[i];

        if (item.type === 'Image') {
          bufferData = Buffer.from(item.value, 'base64');
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
          content: content,
          type: 'image',
          attachments: [fileAttachment]
        });

        return [createResult(ResultCode.Ok, '完成', res)];
      }

      if (threadId) {
        const res = await client.sendDm(threadId, {
          content: content,
          type: 'image',
          attachments: [fileAttachment]
        });

        return [createResult(ResultCode.Ok, '完成', res)];
      }

      return [createResult(ResultCode.Ok, '完成', null)];
    }

    // markdown -> 转成 plain content (simple)
    let contentMd = '';

    if (mdAndButtons && mdAndButtons.length > 0) {
      mdAndButtons.forEach(item => {
        if (item.type === 'Markdown') {
          const md = item.value;

          md.forEach(line => {
            if (line.type === 'MD.text') {
              contentMd += line.value;
            } else if (line.type === 'MD.blockquote') {
              contentMd += `> ${line.value}\n`;
            } else if (line.type === 'MD.bold') {
              contentMd += `**${line.value}**`;
            } else if (line.type === 'MD.italic') {
              contentMd += `*${line.value}*`;
            } else if (line.type === 'MD.divider') {
              contentMd += '---\n';
            } else if (line.type === 'MD.image') {
              contentMd += `![${line.value}](${line.value})`;
            } else if (line.type === 'MD.link') {
              contentMd += `[${line.value}](${line.value})`;
            } else if (line.type === 'MD.list') {
              const listStr = line.value.map(listItem => {
                if (typeof listItem.value === 'object') {
                  return `\n${listItem.value.index}. ${listItem.value.text}`;
                }

                return `\n- ${listItem.value}`;
              });

              contentMd += `${listStr}\n`;
            } else if (line.type === 'MD.newline') {
              contentMd += '\n';
            } else if (line.type === 'MD.code') {
              const language = line?.options?.language || '';

              contentMd += `\`\`\`${language}\n${line.value}\n\`\`\`\n`;
            } else {
              const value = line['value'] || '';

              contentMd += String(value);
            }
          });
        } else if (item.type === 'BT.group' && item.value.length > 0) {
          contentMd += `<box  classWind="mt-2" variant="borderless" >${item.value
            ?.map(row => {
              const val = row.value;

              if (val.length === 0) {
                return '';
              }

              return `<flex>${val
                .map(button => {
                  const value = button.value;
                  const options = button.options;
                  const autoEnter = options?.autoEnter ?? false;
                  const label = typeof value === 'object' ? value.title : value;
                  const command = options?.data || label;

                  return `<btn command="${command}" enter="${String(autoEnter)}" >${label}</btn>`;
                })
                .join('')}</flex>`;
            })
            .join('')}</box>`;
        }
      });
    }

    if ((content && content.length > 0) || (contentMd && contentMd.length > 0)) {
      if (channelId) {
        const res = await client.sendMessage(channelId, { content: content !== '' ? content : contentMd, type: 'text' });

        return [createResult(ResultCode.Ok, '完成', res)];
      }

      if (threadId) {
        const res = await client.sendDm(threadId, { content: content !== '' ? content : contentMd, type: 'text' });

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
