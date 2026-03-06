import { readFileSync } from 'fs';
import { QQBotAPI } from './sdk/api';
import { FileType } from './sdk/typing';
import {
  DataButtonRow,
  ClientAPIMessageResult,
  createResult,
  DataArkBigCard,
  DataArkCard,
  DataArkList,
  DataMarkDown,
  DataMention,
  ResultCode,
  type DataEnums
} from 'alemonjs';
import axios from 'axios';

type Client = typeof QQBotAPI.prototype;

// ==================== 数据构造器 ====================

const createButtonsData = (rows: DataButtonRow[]) => {
  let id = 0;

  return {
    rows: rows.map(row => ({
      buttons: row.value.map(button => {
        const value = button.value;
        const options = button.options;

        id++;
        const typing = options?.type ?? 'command';
        const typeMap = { command: 2, link: 0, call: 1 };

        return {
          id: String(id),
          render_data: {
            label: value,
            visited_label: value,
            style: 0
          },
          action: {
            type: typeMap[typing],
            permission: { type: 2 },
            unsupport_tips: options?.toolTip ?? '',
            data: options?.data ?? '',
            at_bot_show_channel_list: false,
            enter: options?.autoEnter ?? false
          }
        };
      })
    }))
  };
};

const createArkCardData = (value: DataArkCard['value']) => ({
  template_id: 24,
  kv: [
    { key: '#DESC#', value: value.decs },
    { key: '#PROMPT#', value: value.prompt },
    { key: '#TITLE#', value: value.title },
    { key: '#METADESC#', value: value.metadecs },
    { key: '#IMG#', value: value.cover },
    { key: '#LINK#', value: value.link },
    { key: '#SUBTITLE#', value: value.subtitle }
  ]
});

const createArkBigCardData = (value: DataArkBigCard['value']) => ({
  template_id: 37,
  kv: [
    { key: '#PROMPT#', value: value.prompt },
    { key: '#METATITLE#', value: value.title },
    { key: '#METASUBTITLE#', value: value.subtitle },
    { key: '#METACOVER#', value: value.cover },
    { key: '#METAURL#', value: value.link }
  ]
});

const createArkListData = (value: DataArkList['value']) => {
  const [tip, data] = value;

  return {
    template_id: 23,
    kv: [
      { key: '#DESC#', value: tip.value.desc },
      { key: '#PROMPT#', value: tip.value.prompt },
      {
        key: '#LIST#',
        obj: data.value.map(item => {
          const v = item.value;

          if (typeof v === 'string') {
            return { obj_kv: [{ key: 'desc', value: v }] };
          }

          return {
            obj_kv: [
              { key: 'desc', value: v.title },
              { key: 'link', value: v.link }
            ]
          };
        })
      }
    ]
  };
};

const mdFormatters: Record<string, (value: any, options?: any) => string> = {
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
  'MD.image': (value, options) => `\n![text #${options?.width || 208}px #${options?.height || 320}px](${value})\n`,
  'MD.mention': (value, options) => {
    const { belong } = options || {};

    if (belong === 'channel') {
      return '';
    }
    if (belong === 'user') {
      return `<qqbot-at-user id="${value}" />`;
    }
    if (value === 'everyone') {
      return '<qqbot-at-everyone />';
    }

    return `<qqbot-at-user id="${value}" />`;
  },
  'MD.content': value => `${value}`,
  'MD.button': (title, options) => {
    // 得到要发送的文本
    const { data } = options || {};

    return `<qqbot-cmd-input text="${data}" show="${title}" />`;
  }
};

const createMarkdownText = (data: DataMarkDown['value']): string => {
  return data
    .map(mdItem => {
      if (mdFormatters[mdItem.type]) {
        return mdFormatters[mdItem.type]((mdItem as any)?.value, (mdItem as any)?.options);
      }
      if (mdItem.type === 'MD.image') {
        return `\n![text #${mdItem.options?.width || 208}px #${mdItem.options?.height || 320}px](${mdItem.value})\n`;
      }
      if (mdItem.type === 'MD.list' && typeof mdItem.value !== 'string') {
        const listStr = mdItem.value.map(listItem => {
          return typeof listItem.value === 'object' ? `\n${listItem.value.index}. ${listItem.value.text}` : `\n- ${listItem.value}`;
        });

        return `${listStr}\n`;
      }
      if (mdItem.type === 'MD.code') {
        const language = mdItem?.options?.language || '';

        return `\n\`\`\`${language}\n${mdItem.value}\n\`\`\`\n`;
      }

      return String(mdItem['value'] || '');
    })
    .join('');
};

// ==================== 公共提取器 ====================

type MentionMode = 'group' | 'guild-direct' | 'guild-public';

const formatMention = (item: DataMention, mode: MentionMode): string => {
  if (mode === 'guild-direct') {
    return '';
  }

  const value = item.value;
  const isEmptyMention = value === 'everyone' || value === 'all' || value === '' || typeof value !== 'string';

  if (mode === 'guild-public') {
    if (isEmptyMention) {
      return '@everyone';
    }
    if (item.options?.belong === 'user') {
      return `<@!${value}>`;
    }
    if (item.options?.belong === 'channel') {
      return `<#${value}>`;
    }

    return '';
  }

  // group / c2c
  if (isEmptyMention) {
    return '';
  }
  if (item.options?.belong === 'user') {
    return `<@${value}>`;
  }

  return '';
};

/** 从消息数据中提取文本内容 */
const extractContent = (val: DataEnums[], mode: MentionMode): string => {
  return val
    .filter(item => item.type === 'Mention' || item.type === 'Text' || item.type === 'Link')
    .map(item => {
      if (item.type === 'Link') {
        return `[${item.value}](${item?.options?.link})`;
      }
      if (item.type === 'Mention') {
        return formatMention(item as DataMention, mode);
      }
      if (item.type === 'Text') {
        return item.value;
      }

      return '';
    })
    .join('');
};

/** 构建 baseParams（event_id 或 msg_id） */
const buildBaseParams = (tag: string | undefined, messageId: string | undefined, interactionTag: string): Record<string, any> => {
  if (tag === interactionTag) {
    return { event_id: messageId };
  }

  return { msg_id: messageId };
};

/** 构建 Markdown 和按钮参数 */
const buildMdAndButtonsParams = (val: DataEnums[]): Record<string, any> | null => {
  const items = val.filter(item => item.type === 'Markdown' || item.type === 'BT.group' || item.type === 'ButtonTemplate');

  if (items.length === 0) {
    return null;
  }

  const params: Record<string, any> = {};

  for (const item of items) {
    if (item.type === 'ButtonTemplate') {
      if (item?.value) {
        params['keyboard'] = { id: item.value };
      }
    } else if (item.type === 'BT.group' && typeof item?.value !== 'string') {
      params['keyboard'] = { content: createButtonsData(item.value) };
    } else if (item.type === 'Markdown' && typeof item?.value !== 'string') {
      const content = createMarkdownText(item.value);

      if (content) {
        params['markdown'] = { content };
      }
    }
  }

  return params;
};

/** 构建 Ark 参数 */
const buildArkParams = (val: DataEnums[]): Record<string, any> | null => {
  const items = val.filter(item => item.type === 'Ark.BigCard' || item.type === 'Ark.Card' || item.type === 'Ark.list');

  if (items.length === 0) {
    return null;
  }

  const params: Record<string, any> = {};

  for (const item of items) {
    if (item.type === 'Ark.Card' && typeof item?.value !== 'string') {
      params['ark'] = createArkCardData(item.value);
    } else if (item.type === 'Ark.BigCard' && typeof item?.value !== 'string') {
      params['ark'] = createArkBigCardData(item.value);
    } else if (item.type === 'Ark.list' && typeof item?.value !== 'string') {
      params['ark'] = createArkListData(item.value);
    }
  }

  return params;
};

/** 过滤图片数据 */
const filterImages = (val: DataEnums[]) => {
  return val.filter(item => item.type === 'Image' || item.type === 'ImageFile' || item.type === 'ImageURL');
};

// ==================== Open API 发送（群组/私聊） ====================

/** 通过富媒体上传获取图片 URL */
const resolveRichMediaUrl = async (images: DataEnums[], uploadMedia: (data: { file_type: FileType; file_data: string }) => Promise<any>): Promise<string> => {
  for (const item of images) {
    let fileData: string;
    let fileInfo: string;

    if (item.type === 'ImageURL') {
      // 如果是图片链接，需要axios获取图片数据并转换为base64
      fileData = await axios.get(item.value, { responseType: 'arraybuffer' }).then(res => Buffer.from(res.data, 'binary').toString('base64'));
    } else if (item.type === 'Image') {
      if (typeof item.value === 'string' && (item.value.startsWith('https://') || item.value.startsWith('http://'))) {
        // 如果是图片链接，需要axios获取图片数据并转换为base64
        fileData = await axios.get(item.value, { responseType: 'arraybuffer' }).then(res => Buffer.from(res.data, 'binary').toString('base64'));
      } else if (typeof item.value === 'string' && item.value.startsWith('file://')) {
        // 如果是file协议的本地文件路径，读取文件并转换为base64
        const localFilePath = item.value.replace('file://', '');

        fileData = readFileSync(localFilePath, 'base64');
      } else if (typeof item.value === 'string' && item.value.startsWith('base64://')) {
        // 如果是base64协议的字符串，直接提取base64数据
        fileData = item.value.replace('base64://', '');
      } else if (Buffer.isBuffer(item.value)) {
        // 如果已经是Buffer数据，直接转换为base64字符串
        fileData = item.value.toString('base64');
      }
    } else if (item.type === 'ImageFile') {
      fileData = readFileSync(item.value, 'base64');
    }

    if (fileData) {
      fileInfo = await uploadMedia({ file_type: 1, file_data: fileData }).then(res => res?.file_info);
    }

    if (fileInfo) {
      return fileInfo;
    }
  }
};

/** Open API 通用发送逻辑（群组 / C2C） */
const sendOpenApiMessage = async (
  content: string,
  val: DataEnums[],
  baseParams: Record<string, any>,
  uploadMedia: (data: { file_type: FileType; file_data: string }) => Promise<any>,
  sendMessage: (data: any) => Promise<any>,
  label: string
): Promise<ClientAPIMessageResult[]> => {
  // 图片
  const images = filterImages(val);

  if (images.length > 0) {
    const url = await resolveRichMediaUrl(images, uploadMedia);

    if (!url) {
      return [createResult(ResultCode.Fail, '图片上传失败', null)];
    }
    const res = await sendMessage({
      content,
      media: { file_info: url },
      msg_type: 7,
      ...baseParams
    });

    return [createResult(ResultCode.Ok, label, { id: res.id })];
  }

  // Markdown & 按钮
  const mdParams = buildMdAndButtonsParams(val);

  if (mdParams) {
    const res = await sendMessage({ content, msg_type: 2, ...mdParams, ...baseParams });

    return [createResult(ResultCode.Ok, label, { id: res.id })];
  }

  // Ark
  const arkParams = buildArkParams(val);

  if (arkParams) {
    const res = await sendMessage({ content, msg_type: 3, ...arkParams, ...baseParams });

    return [createResult(ResultCode.Ok, label, { id: res.id })];
  }

  // 纯文本
  if (content) {
    const res = await sendMessage({ content, msg_type: 0, ...baseParams });

    return [createResult(ResultCode.Ok, label, { id: res.id })];
  }

  return [];
};

// ==================== Guild API 发送（频道公聊/私聊） ====================

/** 将图片数据解析为 Buffer */
const resolveImageBuffer = async (images: DataEnums[]): Promise<Buffer | null> => {
  for (const item of images) {
    if (item.type === 'ImageURL') {
      return await axios.get(item.value, { responseType: 'arraybuffer' }).then(res => res?.data);
    }

    if (item.type === 'ImageFile') {
      return readFileSync(item.value);
    }

    if (typeof item.value === 'string') {
      if (item.value.startsWith('https://') || item.value.startsWith('http://')) {
        return await axios.get(item.value, { responseType: 'arraybuffer' }).then(res => res?.data);
      }

      if (item.value.startsWith('base64://')) {
        return Buffer.from(item.value.replace('base64://', ''), 'base64');
      }

      if (item.value.startsWith('file://')) {
        return readFileSync(item.value.replace('file://', ''));
      }

      return Buffer.from(item.value, 'base64');
    }

    if (Buffer.isBuffer(item.value)) {
      return item.value;
    }
  }

  return null;
};

/** Guild API 通用发送逻辑（频道公聊 / 频道私聊） */
const sendGuildMessage = async (
  content: string,
  val: DataEnums[],
  baseParams: Record<string, any>,
  sendMessage: (data: any, buffer?: Buffer) => Promise<any>,
  label: string
): Promise<ClientAPIMessageResult[]> => {
  // 图片
  const images = filterImages(val);

  if (images.length > 0) {
    const imageBuffer = await resolveImageBuffer(images);
    const res = await sendMessage({ content, ...baseParams }, imageBuffer);

    return [createResult(ResultCode.Ok, label, { id: res?.id })];
  }

  // Markdown & 按钮
  const mdParams = buildMdAndButtonsParams(val);

  if (mdParams) {
    const res = await sendMessage({ content: '', ...mdParams, ...baseParams });

    return [createResult(ResultCode.Ok, label, { id: res.id })];
  }

  // Ark
  const arkParams = buildArkParams(val);

  if (arkParams) {
    const res = await sendMessage({ content, ...arkParams, ...baseParams });

    return [createResult(ResultCode.Ok, label, { id: res.id })];
  }

  // 纯文本
  if (content) {
    const res = await sendMessage({ content, ...baseParams });

    return [createResult(ResultCode.Ok, label, { id: res?.id })];
  }

  return [];
};

// ==================== 导出函数 ====================

/**
 * 群组消息
 */
export const GROUP_AT_MESSAGE_CREATE = async (
  client: Client,
  event: { ChannelId: string; MessageId?: string; tag?: string },
  val: DataEnums[]
): Promise<ClientAPIMessageResult[]> => {
  const baseParams = buildBaseParams(event.tag, event.MessageId, 'INTERACTION_CREATE_GROUP');
  const content = extractContent(val, 'group');

  try {
    return await sendOpenApiMessage(
      content,
      val,
      baseParams,
      data => client.postRichMediaByGroup(event.ChannelId, data),
      data => client.groupOpenMessages(event.ChannelId, data),
      'client.groupOpenMessages'
    );
  } catch (err) {
    return [createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)];
  }
};

/**
 * 私聊消息
 */
export const C2C_MESSAGE_CREATE = async (
  client: Client,
  event: { UserId: string; MessageId?: string; tag?: string },
  val: DataEnums[]
): Promise<ClientAPIMessageResult[]> => {
  const baseParams = buildBaseParams(event.tag, event.MessageId, 'INTERACTION_CREATE_C2C');
  const content = extractContent(val, 'group');

  try {
    return await sendOpenApiMessage(
      content,
      val,
      baseParams,
      data => client.postRichMediaByUser(event.UserId, data),
      data => client.usersOpenMessages(event.UserId, data),
      'client.usersOpenMessages'
    );
  } catch (err) {
    return [createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)];
  }
};

/**
 * 频道私聊
 */
export const DIRECT_MESSAGE_CREATE = async (
  client: Client,
  event: { UserId: string; MessageId?: string; tag?: string },
  val: DataEnums[]
): Promise<ClientAPIMessageResult[]> => {
  const baseParams = buildBaseParams(event.tag, event.MessageId, 'INTERACTION_CREATE_GUILD');
  const content = extractContent(val, 'guild-direct');

  try {
    return await sendGuildMessage(content, val, baseParams, (data, buf) => client.dmsMessages(event.UserId, data, buf), 'client.dmsMessage');
  } catch (err) {
    return [createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)];
  }
};

/**
 * 频道公聊
 */
export const MESSAGE_CREATE = async (
  client: Client,
  event: { ChannelId: string; MessageId?: string; tag?: string },
  val: DataEnums[]
): Promise<ClientAPIMessageResult[]> => {
  const baseParams = buildBaseParams(event.tag, event.MessageId, 'INTERACTION_CREATE_GUILD');
  const content = extractContent(val, 'guild-public');

  try {
    return await sendGuildMessage(content, val, baseParams, (data, buf) => client.channelsMessages(event.ChannelId, data, buf), 'client.channelsMessagesPost');
  } catch (err) {
    return [createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)];
  }
};

/**
 * 频道公聊 @
 */
export const AT_MESSAGE_CREATE = (
  client: Client,
  event: { ChannelId: string; MessageId?: string; tag?: string },
  val: DataEnums[]
): Promise<ClientAPIMessageResult[]> => {
  return MESSAGE_CREATE(client, event, val);
};
