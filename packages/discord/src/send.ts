import { DataButtonRow, createResult, DataEnums, ResultCode } from 'alemonjs';
import { readFileSync } from 'fs';
import { DCClient } from './sdk/wss';
import { markdownToDiscordText, markdownRawToDiscordText, dataEnumToDiscordText } from './format';
import { getDiscordConfig } from './config';

type Client = typeof DCClient.prototype;

const fetchImageBuffer = async (url: string) => {
  const arrayBuffer = await fetch(url).then(res => res.arrayBuffer());

  return Buffer.from(arrayBuffer);
};

const createButtonsData = (rows: DataButtonRow[]) =>
  rows.map(row => ({
    type: 1,
    components: row.value.map(button => ({
      type: 2,
      custom_id: button.options?.data ?? '',
      style: 1,
      label: button.value
    }))
  }));

/** 解析图片数据为 Buffer */
const resolveImageBuffer = async (item: DataEnums): Promise<Buffer | null> => {
  if (item.type === 'Image') {
    if (Buffer.isBuffer(item.value)) {
      return item.value;
    }
    if (typeof item.value !== 'string') {
      return null;
    }
    if (item.value.startsWith('http://') || item.value.startsWith('https://')) {
      return await fetchImageBuffer(item.value);
    }
    if (item.value.startsWith('base64://')) {
      return Buffer.from(item.value.slice(9), 'base64');
    }
    if (item.value.startsWith('file://')) {
      return readFileSync(item.value.slice(7));
    }

    return Buffer.from(item.value, 'base64');
  }
  if (item.type === 'ImageURL') {
    return await fetchImageBuffer(item.value);
  }
  if (item.type === 'ImageFile') {
    return readFileSync(item.value);
  }

  return null;
};

/** 将 Text / Mention / Link 项转为 Discord 文本 */
const formatTextItem = (item: DataEnums): string => {
  if (item.type === 'Link') {
    return `[${item.value}](${item?.options?.link ?? item.value})`;
  }
  if (item.type === 'Mention') {
    if (item.options?.belong === 'everyone' || item.value === 'everyone' || item.value === 'all' || item.value === '' || typeof item.value !== 'string') {
      return '<@everyone>';
    }
    if (item.options?.belong === 'user') {
      return `<@${item.value}>`;
    }
    if (item.options?.belong === 'channel') {
      return `<#${item.value}>`;
    }

    return '';
  }
  if (item.type === 'Text') {
    const wrapMap: Record<string, string> = { block: '`', italic: '*', bold: '**', boldItalic: '***', strikethrough: '~~' };
    const wrap = wrapMap[item.options?.style];

    return wrap ? `${wrap}${item.value}${wrap}` : item.value;
  }

  return '';
};

export const sendchannel = async (client: Client, param: { channel_id: string }, val: DataEnums[]) => {
  try {
    if (!val || val.length <= 0) {
      return [];
    }

    const channelId = param?.channel_id ?? '';
    const hide = getDiscordConfig().hideUnsupported;

    // 单次遍历分类
    const images: DataEnums[] = [];
    const buttons: DataEnums[] = [];
    const textParts: string[] = [];
    const mdParts: string[] = [];
    const fallbackParts: string[] = [];

    for (const item of val) {
      switch (item.type) {
        case 'Image':
        case 'ImageURL':
        case 'ImageFile':
          images.push(item);
          break;
        case 'BT.group':
        case 'ButtonGroup':
          buttons.push(item);
          break;
        case 'Markdown':
          mdParts.push(markdownToDiscordText(item.value as any, hide));
          break;
        case 'MarkdownOriginal':
          mdParts.push(markdownRawToDiscordText(String(item.value), hide));
          break;
        case 'Mention':
        case 'Text':
        case 'Link':
          textParts.push(formatTextItem(item));
          break;
        default: {
          const t = dataEnumToDiscordText(item, hide);

          if (t) {
            fallbackParts.push(t);
          }
        }
      }
    }

    const finalContent = [textParts.join(''), mdParts.join(''), fallbackParts.join('\n')]
      .filter(Boolean)
      .join('\n')
      .replace(/^[^\S\n\r]+|[^\S\n\r]+$/g, '');

    if (hide && !finalContent && images.length <= 0 && buttons.length <= 0) {
      logger.info('[discord] hideUnsupported: 消息内容转换后为空，跳过发送');

      return [];
    }

    // 发送图片
    if (images.length > 0) {
      let bufferData: Buffer | null = null;

      for (const img of images) {
        bufferData = await resolveImageBuffer(img);
        if (bufferData) {
          break;
        }
      }
      const res = await client.channelsMessagesForm(channelId, { content: finalContent }, bufferData);

      return [createResult(ResultCode.Ok, '完成', res)];
    }

    // 发送按钮
    if (buttons.length > 0) {
      let components = null;

      for (const item of buttons) {
        if (typeof item.value !== 'string') {
          components = createButtonsData(item.value as DataButtonRow[]);
          break;
        }
      }
      const res = await client.channelsMessages(channelId, { content: finalContent, components });

      return [createResult(ResultCode.Ok, '完成', res)];
    }

    // 发送纯文本
    if (finalContent) {
      const res = await client.channelsMessagesForm(channelId, { content: finalContent });

      return [createResult(ResultCode.Ok, '完成', res)];
    }

    return [];
  } catch (err) {
    return [createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)];
  }
};

export const senduser = async (client: Client, param: { author_id?: string; channel_id?: string }, val: DataEnums[]) => {
  if (!val || val.length <= 0) {
    return [];
  }
  const channelId = param?.channel_id ?? (await client.userMeChannels(param.author_id))?.id;

  return sendchannel(client, { channel_id: channelId }, val);
};
