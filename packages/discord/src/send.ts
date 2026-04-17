import { DataButtonRow, DataSelect, DataEmbed, createResult, DataEnums, ResultCode } from 'alemonjs';
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

/** 将通用 Select 组件转换为 Discord Select 组件（包裹在 ActionRow 内） */
const createSelectData = (select: DataSelect) => {
  const meta = select.options ?? {};
  const kind = meta.kind ?? 'string';
  const typeMap = { string: 3, user: 5, role: 6, mentionable: 7, channel: 8 } as const;
  const base: any = {
    type: typeMap[kind] ?? 3,
    custom_id: meta.customId ?? '',
    placeholder: meta.placeholder,
    min_values: meta.minValues,
    max_values: meta.maxValues,
    disabled: meta.disabled
  };

  if (kind === 'string') {
    base.options = (select.value ?? []).map(opt => ({
      label: opt.label,
      value: opt.value,
      description: opt.description,
      default: opt.default,
      emoji: opt.emoji ? { name: opt.emoji } : undefined
    }));
  }

  return { type: 1, components: [base] };
};

/** 将通用 Embed 转换为 Discord Embed */
const createEmbedData = (embed: DataEmbed) => {
  const v = embed.value ?? ({} as DataEmbed['value']);

  return {
    title: v.title,
    description: v.description,
    url: v.url,
    color: v.color,
    timestamp: v.timestamp ? new Date(v.timestamp).toISOString() : undefined,
    image: v.image ? { url: v.image } : undefined,
    thumbnail: v.thumbnail ? { url: v.thumbnail } : undefined,
    author: v.author ? { name: v.author.name, url: v.author.url, icon_url: v.author.iconUrl } : undefined,
    footer: v.footer ? { text: v.footer.text, icon_url: v.footer.iconUrl } : undefined,
    fields: v.fields
  };
};

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
    const selects: DataSelect[] = [];
    const embeds: DataEmbed[] = [];
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
        case 'Select':
          selects.push(item);
          break;
        case 'Embed':
          embeds.push(item);
          break;
        case 'Modal':
          logger.warn('[discord] Modal 必须通过 interaction callback 发送，channelsMessages 流程已跳过');
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

    if (hide && !finalContent && images.length <= 0 && buttons.length <= 0 && selects.length <= 0 && embeds.length <= 0) {
      logger.info('[discord] hideUnsupported: 消息内容转换后为空，跳过发送');

      return [];
    }

    // 构造 components（按钮 + 选择器）
    const components: any[] = [];

    for (const btn of buttons) {
      if (typeof btn.value !== 'string') {
        components.push(...createButtonsData(btn.value as DataButtonRow[]));
      }
    }
    for (const sel of selects) {
      components.push(createSelectData(sel));
    }

    // 构造 embeds
    const embedData = embeds.length > 0 ? embeds.map(createEmbedData) : undefined;

    // 发送图片
    if (images.length > 0) {
      let bufferData: Buffer | null = null;

      for (const img of images) {
        bufferData = await resolveImageBuffer(img);
        if (bufferData) {
          break;
        }
      }
      const payload: any = { content: finalContent };

      if (components.length > 0) {
        payload.components = components;
      }
      if (embedData) {
        payload.embeds = embedData;
      }
      const res = await client.channelsMessagesForm(channelId, payload, bufferData);

      return [createResult(ResultCode.Ok, '完成', res)];
    }

    // 发送带组件/嵌入或纯文本
    if (components.length > 0 || embedData || finalContent) {
      const payload: any = { content: finalContent };

      if (components.length > 0) {
        payload.components = components;
      }
      if (embedData) {
        payload.embeds = embedData;
      }
      const res =
        components.length > 0 || embedData ? await client.channelsMessages(channelId, payload) : await client.channelsMessagesForm(channelId, payload);

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
