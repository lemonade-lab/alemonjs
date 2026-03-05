import { ButtonRow, createResult, DataEnums, ResultCode } from 'alemonjs';
import { readFileSync } from 'fs';
import { DCClient } from './sdk/wss';

type Client = typeof DCClient.prototype;

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

        text = button.options?.data;

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

export const sendchannel = async (
  client: Client,
  param: {
    channel_id: string;
  },
  val: DataEnums[]
) => {
  try {
    if (val.length < 0) {
      return [];
    }
    const channel_id = param?.channel_id ?? '';
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

          return item.value;
        }
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
      const res = await client.channelsMessagesForm(
        channel_id,
        {
          content: content
        },
        bufferData
      );

      return [createResult(ResultCode.Ok, '完成', res)];
    }
    // discord 的 md。会替代掉 content
    let contentMd = '';

    if (mds && mds.length > 0) {
      mds.forEach(item => {
        if (item.type === 'Markdown') {
          const md = item.value;

          md.forEach(line => {
            if (line.type === 'MD.text') {
              // 普通文本
              contentMd += line.value;
            } else if (line.type === 'MD.blockquote') {
              // 引用
              contentMd += `> ${line.value}\n`;
            } else if (line.type === 'MD.bold') {
              // 粗体
              contentMd += `**${line.value}**`;
            } else if (line.type === 'MD.italic') {
              // 斜体
              contentMd += `*${line.value}*`;
            } else if (line.type === 'MD.divider') {
              // 分割线
              contentMd += '---\n';
            } else if (line.type === 'MD.image') {
              // 图片
              contentMd += `![${line.value}](${line.value})`;
            } else if (line.type === 'MD.italicStar') {
              // 星号斜体
              contentMd += `*${line.value}*`;
            } else if (line.type === 'MD.link') {
              // 链接
              contentMd += `[${line.value}](${line.value})`;
            } else if (line.type === 'MD.list') {
              const listStr = line.value.map(listItem => {
                // 有序
                if (typeof listItem.value === 'object') {
                  return `\n${listItem.value.index}. ${listItem.value.text}`;
                }

                return `\n- ${listItem.value}`;
              });

              contentMd += `${listStr}\n`;
            } else if (line.type === 'MD.newline') {
              // 换行
              contentMd += '\n';
            } else if (line.type === 'MD.strikethrough') {
              // 删除线
              contentMd += `~~${line.value}~~`;
            } else if (line.type === 'MD.subtitle') {
              // 副标题
              contentMd += `## ${line.value}\n`;
            } else if (line.type === 'MD.title') {
              // 标题
              contentMd += `# ${line.value}\n`;
            } else if (line.type === 'MD.code') {
              // 代码块
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

        // 构造成按钮
        components = createButtonsData(rows);
      });
      const res = await client.channelsMessages(channel_id, {
        content: contentMd || content,
        components: components
      });

      return [createResult(ResultCode.Ok, '完成', res)];
    }
    if (content) {
      const res = await client.channelsMessagesForm(channel_id, {
        content: contentMd || content
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
  if (val.length < 0) {
    return Promise.all([]);
  }
  const channelId = param?.channel_id ?? (await client.userMeChannels(param.author_id))?.id;

  return sendchannel(client, { channel_id: channelId }, val);
};
