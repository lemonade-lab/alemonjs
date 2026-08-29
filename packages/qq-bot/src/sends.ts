import { readFileSync } from 'fs';
import { QQBotAPI } from './sdk/api';
import { FileType } from './sdk/typing';
import { DataButtonRow, DataButtonGroup, ClientAPIMessageResult, createResult, DataMarkDown, DataMention, ResultCode, logger, type DataEnums } from 'alemonjs';
import axios from 'axios';
import { dataEnumToText, markdownToText, buttonsToText } from './format';
import { getQQBotConfig } from './config';
import type { DataArkBigCard, DataArkCard, DataArkList } from './types';

type Client = typeof QQBotAPI.prototype;

// ==================== 数据构造器 ====================

/** QQ Bot 平台按钮限制：最多 5 行，每行最多 5 个按钮 */
const MAX_BUTTON_ROWS = 5;
const MAX_BUTTONS_PER_ROW = 5;

/**
 * QQ-Bot 按钮样式（render_data.style）：
 * 0 灰色线框 / 1 蓝色线框 / 3 红框 / 4 蓝底白字
 */
const BUTTON_STYLE_MAP: Record<string, number> = {
  gray: 0,
  blue: 1,
  red: 3,
  'blue-fill': 4
};

/** 解析按钮样式：支持样式名与数字（含数字字符串），默认灰框 0 */
const resolveButtonStyle = (style?: string | number): number => {
  if (typeof style === 'number') {
    return style;
  }
  if (typeof style === 'string') {
    if (BUTTON_STYLE_MAP[style] !== undefined) {
      return BUTTON_STYLE_MAP[style];
    }
    // 兼容数字字符串透传
    if (style.trim() !== '' && !Number.isNaN(Number(style))) {
      return Number(style);
    }
  }

  return 0;
};

const createButtonsData = (rows: DataButtonRow[], startId = 0) => {
  let id = startId;

  // 裁剪行数，每行裁剪按钮数
  const clippedRows = rows.slice(0, MAX_BUTTON_ROWS);

  return {
    rows: clippedRows.map(row => ({
      buttons: row.value.slice(0, MAX_BUTTONS_PER_ROW).map(button => {
        const value = button.value;
        const options = button.options;

        id++;
        const typing = options?.type ?? 'command';
        const typeMap = { command: 2, link: 0, call: 1 };

        // 透传的原始数据
        const rowData = options?.rawData ?? {};

        // 点击确认弹窗：优先 options.modal，兼容 data 对象写法 { click, confirm, cancel }
        const data = options?.data as string | { click: string; confirm: string; cancel: string } | undefined;
        const modal =
          options?.modal ??
          (typeof data === 'object' && data
            ? {
                content: data.click,
                confirmText: data.confirm,
                cancelText: data.cancel
              }
            : undefined);

        const action: Record<string, any> = {
          type: typeMap[typing],
          permission: {
            type: typeof options.permission?.type === 'undefined' ? 2 : options?.permission?.type,
            specify_user_ids: options?.permission?.userIds,
            specify_role_ids: options?.permission?.roleIds
          },
          unsupport_tips: options?.toolTip ?? '',
          // 弹窗时 data 置空，确认后按弹窗配置继续
          data: typeof data === 'string' ? data : '',
          at_bot_show_channel_list: options?.atBotShowChannelList ?? false,
          enter: options?.autoEnter ?? false,
          reply: options?.reply ?? false,
          anchor: options?.anchor ?? 0,
          click_limit: options?.clickLimit
        };

        // 按钮点击后弹出确认框（action.modal）
        if (modal) {
          action.modal = {
            content: modal.content ?? '是否确认操作?',
            confirm_text: modal.confirmText ?? '是',
            cancel_text: modal.cancelText ?? '否'
          };
        }

        return {
          id: String(id),
          render_data: {
            label: value,
            visited_label: value,
            style: resolveButtonStyle(options?.style)
          },
          action,
          ...rowData
        };
      })
    })),
    nextId: id
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
  'MD.title': value => `# ${value} `,
  'MD.subtitle': value => `## ${value} `,
  'MD.text': value => `${value} `,
  'MD.bold': value => `**${value}** `,
  'MD.divider': () => '\n***\n',
  'MD.italic': value => `__${value}__ `,
  'MD.italicStar': value => `*${value}* `,
  'MD.strikethrough': value => `~~${value}~~ `,
  'MD.blockquote': value => `\n> ${value} `,
  'MD.newline': () => '\n',
  'MD.link': value => {
    if (!value?.text && !value?.url) {
      return '';
    }
    if (!value?.text || !value?.url) {
      return `<${value?.url ?? value?.text}> `;
    }

    return `[🔗${value?.text}](${value?.url}) `;
  },
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
    const { data, autoEnter } = options || {};

    if (autoEnter) {
      return `<qqbot-cmd-enter text="${data}" show="${title}" />`;
    }

    return `<qqbot-cmd-input text="${data}" show="${title}" />`;
  }
};

const createMarkdownText = (data: DataMarkDown['value']): string => {
  return data
    .map(mdItem => {
      if (mdFormatters[mdItem.type]) {
        return mdFormatters[mdItem.type]((mdItem as any)?.value, (mdItem as any)?.options);
      }
      if (mdItem.type === 'MD.list' && typeof mdItem.value !== 'string') {
        const listStr = mdItem.value.map(listItem => {
          return typeof listItem.value === 'object' ? `\n${listItem.value.index}. ${listItem.value.text}` : `\n- ${listItem.value}`;
        });

        return `${listStr.join('')}\n`;
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
  // 原生支持的类型集合
  const nativeTypes = new Set([
    'Mention',
    'Text',
    'Link',
    'Image',
    'ImageFile',
    'ImageURL',
    'Audio',
    'Video',
    'Attachment',
    'Markdown',
    'MarkdownOriginal',
    'BT.group',
    'ButtonTemplate',
    'Ark.list',
    'Ark.Card',
    'Ark.BigCard'
  ]);
  // 原生文本
  const nativeText = val
    .filter(item => item.type === 'Mention' || item.type === 'Text' || item.type === 'Link')
    .map(item => {
      if (item.type === 'Link') {
        return `[${item.value}](${item?.options?.link})`;
      }
      if (item.type === 'Mention') {
        return formatMention(item, mode);
      }
      if (item.type === 'Text') {
        return item.value;
      }

      return '';
    })
    .join('');
  // 降级处理：将不被原生支持的类型转为文本
  const config = getQQBotConfig();
  const hide = config.hideUnsupported;
  const fallbackText = val
    .filter(item => !nativeTypes.has(item.type))
    .map(item => dataEnumToText(item, hide))
    .filter(Boolean)
    .join('\n');

  return [nativeText, fallbackText].filter(Boolean).join('\n');
};

/**
 * notice 事件中平台支持以 event_id 被动回复的 tag
 * （群聊：GROUP_ADD_ROBOT / GROUP_MSG_RECEIVE；单聊：C2C_MSG_RECEIVE / FRIEND_ADD）
 */
const NOTICE_EVENT_REPLY_TAGS = new Set(['GROUP_ADD_ROBOT', 'GROUP_MSG_RECEIVE', 'C2C_MSG_RECEIVE', 'FRIEND_ADD']);

/** 构建 baseParams（event_id 或 msg_id） */
const buildBaseParams = (tag: string | undefined, messageId: string | undefined, interactionTag: string): Record<string, any> => {
  if ((tag && NOTICE_EVENT_REPLY_TAGS.has(tag)) || tag === interactionTag) {
    return { event_id: messageId };
  }

  return { msg_id: messageId };
};

/** 构建 Markdown 和按钮参数 */
const buildMdAndButtonsParams = (val: DataEnums[]): Record<string, any> | null => {
  const items = (val as any[]).filter(
    item => item.type === 'Markdown' || item.type === 'MarkdownOriginal' || item.type === 'BT.group' || item.type === 'ButtonTemplate'
  );

  if (items.length === 0) {
    return null;
  }

  const params: Record<string, any> = {};

  // 小按钮 / 键盘级配置（BT.group.options）
  let keyboardExtra: DataButtonGroup['options'] | undefined;

  for (const item of items) {
    if (item.type === 'ButtonTemplate') {
      if (item?.value) {
        params['keyboard'] = { id: item.value };
      }
    } else if (item.type === 'BT.group' && typeof item?.value !== 'string') {
      // 键盘级全局配置：小按钮样式 / 原始字段透传
      // （item 类型为 DataEnums 联合，此处按 DataButtonGroup 读取 options）
      const groupOptions = (item as DataButtonGroup)?.options ?? {};

      if (groupOptions.smallButton || groupOptions.rawData) {
        keyboardExtra = {
          smallButton: keyboardExtra?.smallButton || groupOptions.smallButton,
          rawData: groupOptions.rawData
        };
      }
      // 追加模式：合并多个 BT.group 的行，并裁剪到 5×5
      if (params['keyboard']?.content?.rows) {
        const existingRows = params['keyboard'].content.rows;
        const currentId = params['keyboard'].content.nextId ?? existingRows.length;
        const remaining = MAX_BUTTON_ROWS - existingRows.length;

        if (remaining > 0) {
          const { rows: newRows, nextId } = createButtonsData(item.value.slice(0, remaining), currentId);

          existingRows.push(...newRows);
          params['keyboard'].content.nextId = nextId;
        }
      } else {
        const result = createButtonsData(item.value);

        params['keyboard'] = { content: result };
      }
    } else if (item.type === 'Markdown' && typeof item?.value !== 'string') {
      const content = createMarkdownText(item.value);

      if (content) {
        // 应该是追加模式，所以如果已经存在 markdown 内容，则追加到 content 后面
        if (params['markdown']?.content) {
          params['markdown'].content += content;
        } else {
          params['markdown'] = { content };
        }
      }
    } else if (item.type === 'MarkdownOriginal' && typeof item?.value === 'string') {
      if (params['markdown']?.content) {
        params['markdown'].content += '\n' + item.value;
      } else {
        params['markdown'] = { content: item.value };
      }
    }
  }

  // 小按钮样式 / 键盘级原始字段透传（keyboard.content.style）
  if (keyboardExtra && params['keyboard']?.content) {
    if (keyboardExtra.smallButton) {
      params['keyboard'].content.style = { font_size: 'small' };
    }
    if (keyboardExtra.rawData) {
      Object.assign(params['keyboard'].content, keyboardExtra.rawData);
    }
  }

  // 清理内部辅助字段，避免发送到 API
  if (params['keyboard']?.content?.nextId !== undefined) {
    delete params['keyboard'].content.nextId;
  }

  return params;
};

/** 构建 Ark 参数 */
const buildArkParams = (val: DataEnums[]): Record<string, any> | null => {
  const items = (val as any[]).filter(item => item.type === 'Ark.BigCard' || item.type === 'Ark.Card' || item.type === 'Ark.list');

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

/**
 * 富媒体类型 → QQ file_type 映射
 * 1 图片 / 2 视频 / 3 语音 / 4 文件
 */
const MEDIA_FILE_TYPE: Record<string, FileType> = {
  Image: 1,
  ImageFile: 1,
  ImageURL: 1,
  Video: 2,
  Audio: 3,
  Attachment: 4
};

/** 过滤富媒体数据（图片/视频/音频/文件） */
const filterMedia = (val: DataEnums[]) => {
  return val.filter(item => MEDIA_FILE_TYPE[item.type] !== undefined);
};

/** 过滤图片数据（仅图片，频道路径使用） */
const filterImages = (val: DataEnums[]) => {
  return val.filter(item => item.type === 'Image' || item.type === 'ImageFile' || item.type === 'ImageURL');
};

// ==================== Open API 发送（群组/私聊） ====================

/** 将媒体数据解析为 base64（支持 URL / file:// / base64:// / buffer:// / Buffer / 裸 base64） */
const resolveFileData = async (item: any): Promise<string | undefined> => {
  if (item.type === 'ImageURL') {
    return await axios.get(item.value, { responseType: 'arraybuffer' }).then(res => Buffer.from(res.data, 'binary').toString('base64'));
  }
  if (item.type === 'ImageFile') {
    return readFileSync(item.value, 'base64');
  }

  const value = item.value;

  if (typeof value === 'string') {
    if (value.startsWith('https://') || value.startsWith('http://')) {
      // URL 资源：拉取后转 base64
      return await axios.get(value, { responseType: 'arraybuffer' }).then(res => Buffer.from(res.data, 'binary').toString('base64'));
    }
    if (value.startsWith('buffer://')) {
      return value.replace('buffer://', '');
    }
    if (value.startsWith('file://')) {
      return readFileSync(value.replace('file://', ''), 'base64');
    }
    if (value.startsWith('base64://')) {
      return value.replace('base64://', '');
    }

    return value; // 兜底：裸 base64
  }
  if (Buffer.isBuffer(value)) {
    return value.toString('base64');
  }

  return undefined;
};

/**
 * 通过富媒体上传获取 file_info（图片/视频/音频/文件）
 * 按 MEDIA_FILE_TYPE 自动选择 file_type，超出 10MB 的文件自动走分片上传
 */
const resolveMediaUrl = async (media: DataEnums[], uploadMedia: (data: { file_type: FileType; file_data: string }) => Promise<any>): Promise<string> => {
  for (const item of media) {
    const fileData = await resolveFileData(item);

    if (fileData) {
      const fileInfo = await uploadMedia({ file_type: MEDIA_FILE_TYPE[item.type] ?? 1, file_data: fileData }).then(res => res?.file_info);

      if (fileInfo) {
        return fileInfo;
      }
    }
  }

  return undefined;
};

/** 移除富媒体占位符（dataEnumToText 降级产生的 [视频]/[音频]/[附件]） */
const stripMediaPlaceholders = (text: string): string =>
  text
    .replace(/\[附件[^\]]*\]/g, '')
    .replace(/\[音频\]/g, '')
    .replace(/\[视频\]/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim();

/** 当 markdownToText 选项开启时，将 Markdown 和按钮降级为纯文本并追加到 content */
const flattenMdToText = (content: string, val: DataEnums[]): string => {
  const mdItems = val.filter(item => item.type === 'Markdown');
  const btnItems = val.filter(item => item.type === 'BT.group');
  const parts: string[] = [content];

  for (const item of mdItems) {
    if (item.type === 'Markdown' && typeof item.value !== 'string') {
      parts.push(markdownToText(item.value));
    }
  }
  for (const item of btnItems) {
    if (item.type === 'BT.group' && typeof item.value !== 'string') {
      parts.push(buttonsToText(item.value as any));
    }
  }

  return parts
    .filter(Boolean)
    .join('\n')
    .replace(/^[^\S\n\r]+|[^\S\n\r]+$/g, '');
};

/** Open API 通用发送逻辑（群组 / C2C） */
const sendOpenApiMessage = async (
  content: string,
  val: DataEnums[],
  baseParams: Record<string, any>,
  uploadMedia: (data: { file_type: FileType; file_data: string }) => Promise<any>,
  sendMessage: (data: any) => Promise<any>,
  label: string,
  options?: { forceVerifyImageResource?: boolean }
): Promise<ClientAPIMessageResult[]> => {
  const config = getQQBotConfig();
  const mdToText = config.markdownToText === true;

  // 富媒体：图片 / 视频 / 音频 / 文件（群聊、单聊支持）
  const media = filterMedia(val);

  if (media.length > 0) {
    const fileInfo = await resolveMediaUrl(media, uploadMedia);

    if (!fileInfo) {
      return [createResult(ResultCode.Fail, '媒体上传失败', null)];
    }
    // 富媒体消息(msg_type:7)无法携带原生 markdown 模板，始终将 MD/Buttons 降级为文本合入 content
    // 并移除已作为富媒体发送的占位符（[视频]/[音频]/[附件]）
    const mediaContent = stripMediaPlaceholders(flattenMdToText(content, val));
    const res = await sendMessage({
      content: mediaContent,
      media: { file_info: fileInfo },
      msg_type: 7,
      ...baseParams
    });

    return [createResult(ResultCode.Ok, label, { id: res.id })];
  }

  // hideUnsupported 模式：检查转换后内容是否为空
  if (config.hideUnsupported === true && !content && !buildMdAndButtonsParams(val) && !buildArkParams(val)) {
    logger.info('[qq-bot] hideUnsupported: 消息内容转换后为空，跳过发送');

    return [];
  }

  // markdownToText 模式：跳过原生 MD，全部降级为纯文本
  if (mdToText) {
    const textContent = flattenMdToText(content, val);

    if (textContent) {
      const res = await sendMessage({ content: textContent, msg_type: 0, ...baseParams });

      return [createResult(ResultCode.Ok, label, { id: res.id })];
    }

    return [];
  }

  // Markdown & 按钮
  const mdParams = buildMdAndButtonsParams(val);

  if (mdParams) {
    // 规则 2：Text 合并进 Markdown — 将 content 合入 markdown.content 使其在消息体中可见
    if (mdParams.markdown?.content && content) {
      mdParams.markdown.content = content + '\n' + mdParams.markdown.content;
    }
    const res = await sendMessage({ content, msg_type: 2, ...mdParams, ...baseParams, force_verify_image_resource: options?.forceVerifyImageResource });

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
  const config = getQQBotConfig();
  const mdToText = config.markdownToText === true;

  // 图片
  const images = filterImages(val);

  if (images.length > 0) {
    const imageBuffer = await resolveImageBuffer(images);
    // 图片消息无法携带原生 markdown，始终将 MD/Buttons 降级为文本合入 content
    const imgContent = flattenMdToText(content, val);
    const res = await sendMessage({ content: imgContent, ...baseParams }, imageBuffer);

    return [createResult(ResultCode.Ok, label, { id: res?.id })];
  }

  // hideUnsupported 模式：检查转换后内容是否为空
  if (config.hideUnsupported && !content && !buildMdAndButtonsParams(val) && !buildArkParams(val)) {
    logger.info('[qq-bot] hideUnsupported: 消息内容转换后为空，跳过发送');

    return [];
  }

  // markdownToText 模式：跳过原生 MD，全部降级为纯文本
  if (mdToText) {
    const textContent = flattenMdToText(content, val);

    if (textContent) {
      const res = await sendMessage({ content: textContent, ...baseParams });

      return [createResult(ResultCode.Ok, label, { id: res?.id })];
    }

    return [];
  }

  // Markdown & 按钮
  const mdParams = buildMdAndButtonsParams(val);

  if (mdParams) {
    // 规则 2：Text 合并进 Markdown — 将 content 合入 markdown.content 使其在消息体中可见
    if (mdParams.markdown?.content && content) {
      mdParams.markdown.content = content + '\n' + mdParams.markdown.content;
    }
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
  event: { ChannelId: string; MessageId?: string; _tag?: string },
  val: DataEnums[],
  options?: { forceVerifyImageResource?: boolean }
): Promise<ClientAPIMessageResult[]> => {
  const baseParams = buildBaseParams(event._tag, event.MessageId, 'INTERACTION_CREATE_GROUP');
  const content = extractContent(val, 'group');

  try {
    return await sendOpenApiMessage(
      content,
      val,
      baseParams,
      data => client.postRichMediaByGroup(event.ChannelId, data),
      data => client.groupOpenMessages(event.ChannelId, data),
      'client.groupOpenMessages',
      options
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
  event: { UserId: string; MessageId?: string; _tag?: string },
  val: DataEnums[],
  options?: { forceVerifyImageResource?: boolean }
): Promise<ClientAPIMessageResult[]> => {
  const baseParams = buildBaseParams(event._tag, event.MessageId, 'INTERACTION_CREATE_C2C');
  const content = extractContent(val, 'group');

  try {
    return await sendOpenApiMessage(
      content,
      val,
      baseParams,
      data => client.postRichMediaByUser(event.UserId, data),
      data => client.usersOpenMessages(event.UserId, data),
      'client.usersOpenMessages',
      options
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
  event: { UserId: string; MessageId?: string; _tag?: string },
  val: DataEnums[]
): Promise<ClientAPIMessageResult[]> => {
  const baseParams = buildBaseParams(event._tag, event.MessageId, 'INTERACTION_CREATE_GUILD');
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
  event: { ChannelId: string; MessageId?: string; _tag?: string },
  val: DataEnums[]
): Promise<ClientAPIMessageResult[]> => {
  const baseParams = buildBaseParams(event._tag, event.MessageId, 'INTERACTION_CREATE_GUILD');
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
  event: { ChannelId: string; MessageId?: string; _tag?: string },
  val: DataEnums[]
): Promise<ClientAPIMessageResult[]> => {
  return MESSAGE_CREATE(client, event, val);
};
