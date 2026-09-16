// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
import type { SendMessageReference, ParsedMessageContent, ForwardNode } from './types.js';
import type { ImageFormat, ImageResource, VideoResource } from './media.js';

export type { ParsedMessageContent } from './types.js';

export interface ImageAsset {
  oid: string;
  skey: string;
  md5: string;
  dataSize: number;
  width: number;
  height: number;
  format?: Exclude<ImageFormat, 'unknown'>;
}

export interface ReplyMessageOptions {
  text: string;
  referencedMessageId: string;
  referencedMessageType: number;
  referencedUid: string;
  referencedSecUid?: string;
  nickname?: string;
  referencedText?: string;
  rootMessageId?: string;
  rootMessageConvIndex?: string;
}

export interface ReplyPayload {
  content: string;
  reference: SendMessageReference;
}

/** messageType=1 文本 content（HTTP SDK 可投递） */
export function buildLegacyTextContent(text: string): string {
  return JSON.stringify({ text });
}

/** 创作者 Web 文本消息 content（messageType=7，HTTP 路径 aweType=774） */
export function buildCreatorTextContent(text: string): string {
  return JSON.stringify({ text, aweType: 774 });
}

/** 文本 @ 提及（richTextInfos 元数据） */
export interface TextMention {
  uid: string;
  text: string;
  location: number;
  length: number;
}

/** Desktop IM 文本 content；字段和值与 jumpbyte 的成功 HAR 保持一致。 */
export function buildDesktopTextContent(text: string, mentions: TextMention[] = []): string {
  return JSON.stringify({
    aweType: 700,
    type: 0,
    richTextInfos: mentions.map(mention => ({
      infoType: 1,
      location: mention.location,
      length: mention.length,
      info: { uid: mention.uid }
    })),
    text
  });
}

export function buildImageContent(image: ImageAsset): string {
  return JSON.stringify({
    resource_url: {
      oid: image.oid,
      skey: image.skey,
      data_size: image.dataSize,
      md5: image.md5
    },
    cover_height: image.height,
    cover_width: image.width,
    check_pics: [],
    md5: image.md5,
    from_gallery: 1,
    aweType: image.format === 'gif' ? 2703 : 2702
  });
}

export interface FileAssetPayload {
  uri: string;
  skey: string;
  md5: string;
  name: string;
  dataSize: number;
}

/** 文件消息 content（messageType=6，aweType=15001，字段与官方接收样例同形） */
export function buildFileContent(file: FileAssetPayload): string {
  return JSON.stringify({
    aweType: 15001,
    uri: file.uri,
    skey: file.skey,
    md5: file.md5,
    name: file.name,
    data_size: file.dataSize,
    format: file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '',
    createdAt: 0,
    is_card: false,
    msgHint: ''
  });
}

export function buildVideoContent(video: {
  tkey: string;
  skey: string;
  md5: string;
  poster: ImageAsset;
  width: number;
  height: number;
  checkPics?: string[];
}): string {
  return JSON.stringify({
    video: { tkey: video.tkey, md5: video.md5, skey: video.skey },
    poster: { oid: video.poster.oid, md5: video.poster.md5, skey: video.poster.skey },
    height: video.height,
    width: video.width,
    check_pics: video.checkPics ?? []
  });
}

export function buildReplyPayload(options: ReplyMessageOptions): ReplyPayload {
  const hint = JSON.stringify({
    refmsg_type: options.referencedMessageType,
    content: options.referencedText ?? '',
    refmsg_uid: options.referencedUid,
    refmsg_sec_uid: options.referencedSecUid ?? '',
    nickname: options.nickname ?? '',
    refmsg_content: '',
    version: 0,
    itemId: '',
    scene_type: 0
  });
  const reference: SendMessageReference = {
    referencedMessageId: options.referencedMessageId,
    hint
  };

  if (options.rootMessageId) {
    reference.rootMessageId = options.rootMessageId;
  }
  if (options.rootMessageConvIndex) {
    reference.rootMessageConvIndex = options.rootMessageConvIndex;
  }

  return { content: buildDesktopTextContent(options.text), reference };
}

/* ---------------------------------------------------------------------------
 * 入站内容解析
 * ------------------------------------------------------------------------- */

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function imageFromObject(value: Record<string, unknown>): ImageResource | undefined {
  const resource = objectValue(value['resource_url']) ?? value;
  const oid = String(resource['oid'] ?? resource['uri'] ?? '');
  const skey = String(resource['skey'] ?? '');
  const urls = (name: string): string[] => stringArray(resource[name] ?? value[name]);

  if (!oid && !skey && !['origin_url_list', 'large_url_list', 'medium_url_list', 'thumb_url_list'].some(name => urls(name).some(Boolean))) {
    return undefined;
  }

  return {
    oid,
    skey,
    md5: String(resource['md5'] ?? value['md5'] ?? ''),
    dataSize: Number(resource['data_size'] ?? value['data_size'] ?? 0),
    width: Number(value['cover_width'] ?? resource['width'] ?? 0),
    height: Number(value['cover_height'] ?? resource['height'] ?? 0),
    originUrls: urls('origin_url_list'),
    largeUrls: urls('large_url_list'),
    mediumUrls: urls('medium_url_list'),
    thumbUrls: urls('thumb_url_list')
  };
}

/** wire 消息类型用于区分同形 resource_url（如语音 vs 图片） */
export function parseMessageContent(content: string, messageType?: number): ParsedMessageContent {
  let value: Record<string, unknown>;

  try {
    const decoded: unknown = JSON.parse(content);

    if (!objectValue(decoded)) {
      return { kind: 'unknown', text: content, aweType: 0, value: content };
    }
    value = decoded as Record<string, unknown>;
  } catch {
    return { kind: 'text', text: content, aweType: 0 };
  }
  const aweType = Number(value['aweType'] ?? value['awe_type'] ?? 0);
  const text = String(value['text'] ?? value['content'] ?? value['display_name'] ?? '');

  if (messageType === 17) {
    const resource = objectValue(value['resource_url']);

    return {
      kind: 'audio',
      text,
      aweType,
      audio: { urls: stringArray(resource?.['url_list']), uri: String(resource?.['uri'] ?? '') },
      value
    };
  }
  if (messageType === 6 || messageType === 150) {
    return {
      kind: 'file',
      text: String(value['name'] ?? ''),
      aweType,
      value,
      file: {
        uri: String(value['uri'] ?? ''),
        skey: String(value['skey'] ?? ''),
        md5: String(value['md5'] ?? ''),
        name: String(value['name'] ?? ''),
        dataSize: Number(value['data_size'] ?? 0)
      }
    };
  }
  // 通话状态/一起看邀请：hint 即展示文本
  if (messageType === 73 || messageType === 90) {
    return { kind: 'text', text: String(value['hint'] ?? ''), aweType };
  }
  // 系统引导模板（如开启消息通知）：无内容价值，置空文本由分发层过滤
  if (messageType === 1 && aweType === 133) {
    return { kind: 'text', text: '', aweType };
  }
  if (messageType === 26) {
    return {
      kind: 'link',
      text: String(value['title'] ?? ''),
      aweType,
      value,
      link: {
        url: String(value['link_url'] ?? ''),
        title: String(value['title'] ?? ''),
        description: String(value['desc'] ?? ''),
        coverUrl: String(value['cover_url'] ?? '')
      }
    };
  }
  if (messageType === 25) {
    return {
      kind: 'user',
      text: String(value['name'] ?? ''),
      aweType,
      value,
      user: {
        uid: String(value['uid'] ?? ''),
        secUid: String(value['secUID'] ?? ''),
        name: String(value['name'] ?? ''),
        avatarUrl: stringArray(objectValue(value['avatar'])?.['url_list'])[0] ?? ''
      }
    };
  }
  if (messageType === 8 || messageType === 77 || ((messageType === null || messageType === undefined) && aweType === 800)) {
    const title = String(value['content_title'] ?? '');

    return {
      kind: 'share',
      text: text || title,
      aweType,
      share: {
        itemId: String(value['itemId'] ?? ''),
        title,
        authorUid: String(value['uid'] ?? ''),
        authorSecUid: String(value['secUID'] ?? '')
      },
      value
    };
  }
  if (messageType === 136) {
    const summary = Array.isArray(value['list_content']) ? value['list_content'] : [];
    const refs = Array.isArray(value['msg_ids']) ? value['msg_ids'] : [];
    const refById = new Map(refs.map(ref => [String(ref?.['msg_id'] ?? ''), ref as Record<string, unknown>]));
    const nodes: ForwardNode[] = [];

    for (const item of summary) {
      const msgId = String(item?.['msgid'] ?? '');
      const ref = refById.get(msgId);

      nodes.push({
        uid: String(ref?.['uid'] ?? ''),
        nickname: String(item?.['nick_name'] ?? ''),
        text: String(item?.['text'] ?? ''),
        msgType: Number(ref?.['msg_type'] ?? 0),
        aweType: Number(ref?.['awe_type'] ?? 0),
        msgId,
        ...(ref?.['sec_uid'] ? { secUid: String(ref['sec_uid']) } : {}),
        ...(ref?.['create_time'] ? { createTime: Number(ref['create_time']) } : {})
      });
    }

    return { kind: 'forward', text: '[合并转发]', aweType, nodes, value };
  }
  // 明确不支持的 wire 类型不得从通用 resource 字段猜测
  if (messageType !== null && messageType !== undefined && ![1, 2, 5, 7, 27, 30].includes(messageType)) {
    return { kind: 'unknown', text, aweType, value };
  }
  const image = imageFromObject(value);

  if (image) {
    return { kind: 'image', text, aweType: aweType || 2702, image };
  }

  const videoValue = objectValue(value['video']);

  if (videoValue) {
    const posterValue = objectValue(value['poster']);
    const poster = posterValue ? imageFromObject(posterValue) : undefined;
    const video: VideoResource = {
      tkey: String(videoValue['tkey'] ?? ''),
      skey: String(videoValue['skey'] ?? ''),
      md5: String(videoValue['md5'] ?? ''),
      width: Number(value['width'] ?? 0),
      height: Number(value['height'] ?? 0),
      checkPics: stringArray(value['check_pics']),
      ...(poster ? { poster } : {})
    };

    return { kind: 'video', text, aweType, video };
  }

  const emojiUrl = objectValue(value['url']);
  const url = String(emojiUrl?.['uri'] ?? stringArray(emojiUrl?.['url_list'])[0] ?? '');

  if (aweType === 507 || url) {
    return { kind: 'emoji', text, aweType: aweType || 507, url };
  }
  if (text || 'text' in value) {
    return { kind: 'text', text, aweType };
  }

  return { kind: 'unknown', text, aweType, value };
}

/**
 * 将简单 `{"text":"..."}` 或纯文本转为 type=7 内容。
 * HTTP 默认 aweType=774；desktop 发送使用 normalizeDesktopTextMessageContent（aweType=700）。
 */
export function normalizeTextMessageContent(content: string, msgType: number): string {
  if (msgType === 1) {
    try {
      const j = JSON.parse(content) as { text?: string };

      if (j.text !== null && j.text !== undefined) {
        return content;
      }
    } catch {
      return buildLegacyTextContent(content);
    }

    return content;
  }
  if (msgType !== 7) {
    return content;
  }
  try {
    const j = JSON.parse(content) as { text?: string; aweType?: number; ai_ext?: string };

    if (j.text !== null && j.text !== undefined && (j.aweType === null || j.aweType === undefined) && !('ai_ext' in j)) {
      return buildCreatorTextContent(j.text);
    }
    if ((j.aweType !== null && j.aweType !== undefined) || (j.ai_ext !== null && j.ai_ext !== undefined)) {
      return content;
    }
  } catch {
    return buildCreatorTextContent(content);
  }

  return content;
}

/** 仅将普通文本转换成 Desktop IM 模板，富媒体保持原样。 */
export function normalizeDesktopTextMessageContent(content: string, msgType: number): string {
  if (msgType !== 7) {
    return normalizeTextMessageContent(content, msgType);
  }
  try {
    // JSON.parse("1") 返回数字而非对象，必须显式校验，否则裸数字/布尔文本会原样发出
    const value = JSON.parse(content) as unknown;

    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return buildDesktopTextContent(content);
    }
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record);
    const isPlainText =
      typeof record['text'] === 'string' &&
      keys.every(key => ['text', 'aweType', 'type', 'richTextInfos'].includes(key)) &&
      (!Array.isArray(record['richTextInfos']) || record['richTextInfos'].length === 0);

    return isPlainText ? buildDesktopTextContent(record['text'] as string) : content;
  } catch {
    return buildDesktopTextContent(content);
  }
}

/** 入站消息展示文本：解析失败时按 kind 回退占位符 */
export function displayText(content: string, messageType: number): string {
  const parsed = parseMessageContent(content, messageType);

  if (parsed.text) {
    return parsed.text;
  }
  if (parsed.kind === 'image') {
    return '[图片]';
  }
  if (parsed.kind === 'video') {
    return '[视频]';
  }
  if (parsed.kind === 'emoji') {
    return parsed.text || '[表情]';
  }
  if (parsed.kind === 'audio') {
    return '[语音]';
  }
  if (parsed.kind === 'share') {
    return '[分享作品]';
  }

  return content;
}
