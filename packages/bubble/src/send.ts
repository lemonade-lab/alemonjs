import { ButtonRow, createResult, DataEnums, ResultCode } from 'alemonjs';
import { readFileSync } from 'fs';
import { BubbleClient } from './sdk/wss';

type Client = typeof BubbleClient.prototype;

const ImageURLToBuffer = async (url: string) => {
  const arrayBuffer = await fetch(url).then(res => res.arrayBuffer());

  return Buffer.from(arrayBuffer);
};

const createButtonsData = (rows: ButtonRow[]) => {
  return rows.map(row => {
    const val = row.value;

    return {
      type: 1,
      components: val.map(button => {
        const value = button.value;
        let text = '';

        if (typeof button.options?.data === 'object') {
          text = button.options?.data.click;
        } else {
          text = button.options.data;
        }

        return {
          type: 2,
          custom_id: text,
          style: 1,
          label: typeof value === 'object' ? value.title : value
        };
      })
    };
  });
};

export const sendchannel = async (
  client: Client,
  param: {
    channel_id: string | number;
  },
  val: DataEnums[]
) => {
  try {
    if (!val || val.length <= 0) {
      return [];
    }
    const channelId = String(param?.channel_id ?? '');
    // images
    const images = val.filter(item => item.type === 'Image' || item.type === 'ImageURL' || item.type === 'ImageFile');
    // buttons
    const buttons = val.filter(item => item.type === 'BT.group');
    // markdown
    const mds = val.filter(item => item.type === 'Markdown');
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

      const uploadRes = await client.uploadFile(bufferData, undefined, { channelId });

      // uploadRes 的结构是 { file: Attachment }，需要提取 file 字段
      const fileAttachment = uploadRes?.file;

      if (!fileAttachment) {
        throw new Error('文件上传失败：未返回文件信息');
      }

      const attachments = [fileAttachment];

      const payload = {
        content: content,
        type: 'text',
        attachments
      };

      const res = await client.sendMessage(channelId, payload);

      return [createResult(ResultCode.Ok, '完成', res)];
    }

    // markdown -> 转成 plain content (simple)
    let contentMd = '';

    if (mds && mds.length > 0) {
      mds.forEach(item => {
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
        }
      });
    }

    if (buttons && buttons.length > 0) {
      let components = null;

      buttons.forEach(item => {
        if (components) {
          return;
        }
        const rows = item.value;

        components = createButtonsData(rows);
      });

      const res = await client.sendMessage(channelId, {
        content: contentMd || content,
        components
      });

      return [createResult(ResultCode.Ok, '完成', res)];
    }

    if (content && content.length > 0) {
      const res = await client.sendMessage(channelId, { content: contentMd || content });

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
    author_id?: string | number;
    channel_id?: string | number;
  },
  val: DataEnums[]
) => {
  if (!val || val.length <= 0) {
    return [];
  }

  let channelId: string | number | undefined = param?.channel_id;

  if (!channelId && param.author_id) {
    const dm = await client.getOrCreateDm(param.author_id);

    channelId = dm?.id;
  }

  if (!channelId) {
    return [];
  }

  return sendchannel(client, { channel_id: channelId }, val);
};

export default {};
