// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
import { randomUUID } from 'node:crypto';
import protobuf from 'protobufjs';
import { logger } from '../logger.js';
import {
  buildImageContent,
  buildVideoContent,
  buildFileContent,
  buildDesktopTextContent,
  buildReplyPayload,
  normalizeDesktopTextMessageContent
} from './content.js';
import type { ImProtoTransport } from './transport.js';
import type { ConversationAddress, SendMessageItem, SendMessageReference, SendMessageResponse, ForwardNode } from './types.js';
import type { ImageAsset, FileAssetPayload, TextMention } from './content.js';

const LONG = protobuf.util.Long as unknown as { fromString(s: string): unknown };

/** 发送上下文：统一 HTTP cookie 通道（native ImOption profile） */
export interface SendContext {
  transport: ImProtoTransport;
  deviceId: string;
}

function encodeReference(reference: SendMessageReference): Record<string, unknown> {
  return {
    referencedMessageId: LONG.fromString(reference.referencedMessageId),
    hint: reference.hint,
    ...(reference.rootMessageId ? { rootMessageId: LONG.fromString(reference.rootMessageId) } : {}),
    ...(reference.rootMessageConvIndex ? { rootMessageConvIndex: LONG.fromString(reference.rootMessageConvIndex) } : {})
  };
}

/** cmd=100 /v1/message/send — 统一发送（文本/媒体/引用全走此路径） */
export async function send(ctx: SendContext, options: SendMessageItem): Promise<SendMessageResponse> {
  const clientMessageId = randomUUID();
  const timestamp = Date.now();
  const decoded = await ctx.transport.sendCookieProto(
    100,
    options.inboxType ?? 0,
    '/v1/message/send',
    {
      sendMessage: {
        conversationId: options.conversationId,
        conversationType: options.conversationType ?? 1,
        conversationShortId: LONG.fromString(options.conversationShortId || '0'),
        content: normalizeDesktopTextMessageContent(options.content, options.messageType ?? 7),
        messageType: options.messageType ?? 7,
        clientMessageId,
        ext: {
          's:mentioned_users': '',
          's:client_message_id': clientMessageId,
          's:stime': `${timestamp}.${String(timestamp % 10_000).padStart(4, '0')}`
        },
        ...(options.reference ? { refMsgInfo: encodeReference(options.reference) } : {}),
        ...(options.mentionedUsers?.length ? { mentionedUsers: options.mentionedUsers.map(uid => LONG.fromString(uid)) } : {})
      }
    },
    ctx.deviceId
  );
  const result = parseSendResponse(decoded, clientMessageId);

  if (result.checkCode === 10502) {
    // 文件/媒体消息常见：已提交、审核放行（raw_check_code=1），异步审核后对方可见
    logger.info('[douyin:im] 消息已提交，审核中（10502），对方可能延迟可见');
  } else if (result.statusCode !== 0) {
    logger.warn(
      `[douyin:im] 发送被拒: conversationId=${options.conversationId} ` +
        `statusCode=${result.statusCode} check=${result.checkCode ?? '-'} detail=${result.statusMsg}`
    );
  }

  return result;
}

/** 发送文本（可带 @ 提及：content richTextInfos + mentionedUsers 字段） */
export async function sendText(ctx: SendContext, address: ConversationAddress, text: string, mentions?: TextMention[]): Promise<SendMessageResponse> {
  return await send(ctx, {
    ...address,
    content: mentions?.length ? buildDesktopTextContent(text, mentions) : text,
    messageType: 7,
    ...(mentions?.length ? { mentionedUsers: [...new Set(mentions.map(m => m.uid))] } : {})
  });
}

export interface SendForwardOptions extends ConversationAddress {
  nodes: ForwardNode[];
  /** 发送者 uid（bot 自身） */
  selfUid: string;
  /** 发送者 secUid（bot 自身） */
  selfSecUid?: string;
}

/** 节点文本摘要：文字原样，媒体占位（list_content.text） */
function nodeSummaryText(message: Array<{ type: string; text?: string }>): string {
  return message
    .map(el => {
      if (el.type === 'text') {
        return el.text ?? '';
      }
      if (el.type === 'image') {
        return '[图片]';
      }
      if (el.type === 'video') {
        return '[视频]';
      }
      if (el.type === 'record') {
        return '[语音]';
      }

      return `[${el.type}]`;
    })
    .join('');
}

/** 节点消息类型：文本 7/700，图片 27/2702，其余按文本处理 */
function nodeMessageType(message: Array<{ type: string }>): { msgType: number; aweType: number } {
  const first = message[0]?.type;

  if (first === 'image') {
    return { msgType: 27, aweType: 2702 };
  }

  return { msgType: 7, aweType: 700 };
}

/**
 * 合并转发（messageType=136）：list_content 为节点摘要，msg_ids 为节点引用。
 * 服务端按收到的同形内容渲染，msg_id 用客户端生成的数字串。
 */
export async function sendMergeForward(ctx: SendContext, options: SendForwardOptions): Promise<SendMessageResponse> {
  if (!options.nodes.length) {
    throw new Error('合并转发节点为空');
  }
  const timestamp = Date.now();
  const listContent = options.nodes.map(node => ({
    text: node.text,
    msgid: node.msgId,
    nick_name: node.nickname
  }));
  const msgIds = options.nodes.map(node => ({
    msg_id: node.msgId,
    msg_type: node.msgType,
    awe_type: node.aweType,
    show_flag: true,
    uid: Number(node.uid),
    ...(node.secUid ? { sec_uid: node.secUid } : {}),
    create_time: node.createTime ?? timestamp,
    ref_msg_invisible: 0
  }));

  return await send(ctx, {
    ...options,
    content: JSON.stringify({ list_content: listContent, msg_ids: msgIds }),
    messageType: 136
  });
}

/** karin node fake 节点 → ForwardNode（客户端生成 19 位数字 msg_id） */
export function buildForwardNodes(
  nodes: Array<{ userId: string; nickname: string; message: Array<{ type: string; text?: string }> }>,
  selfUid: string,
  selfSecUid: string | undefined
): ForwardNode[] {
  const timestamp = Date.now();

  return nodes.map((node, index) => {
    const { msgType, aweType } = nodeMessageType(node.message);

    return {
      uid: /^\d+$/.test(node.userId) ? node.userId : selfUid,
      nickname: node.nickname || '',
      text: nodeSummaryText(node.message),
      msgType,
      aweType,
      msgId: String(BigInt(timestamp) * 1000n + BigInt(index)),
      ...(node.userId === selfUid && selfSecUid ? { secUid: selfSecUid } : {}),
      createTime: timestamp
    };
  });
}

export interface SendMediaOptions extends ConversationAddress {
  /** uploadImage 返回的图片资产 */
  image: ImageAsset;
}

/** 发送图片（gif → aweType 2703，其余 2702；messageType=27） */
export async function sendImage(ctx: SendContext, options: SendMediaOptions): Promise<SendMessageResponse> {
  return await send(ctx, { ...options, content: buildImageContent(options.image), messageType: 27 });
}

export interface SendVideoOptions extends ConversationAddress {
  video: {
    tkey: string;
    skey: string;
    md5: string;
    poster: ImageAsset;
    width: number;
    height: number;
    checkPics?: string[];
  };
}

/** 发送视频（messageType=30，content 无 aweType） */
export async function sendVideo(ctx: SendContext, options: SendVideoOptions): Promise<SendMessageResponse> {
  return await send(ctx, { ...options, content: buildVideoContent(options.video), messageType: 30 });
}

export interface SendFileOptions extends ConversationAddress {
  /** uploadFile 返回的文件资产 */
  file: FileAssetPayload;
}

/** 发送文件（messageType=6，aweType=15001） */
export async function sendFile(ctx: SendContext, options: SendFileOptions): Promise<SendMessageResponse> {
  return await send(ctx, { ...options, content: buildFileContent(options.file), messageType: 6 });
}

export interface ReplyOptions extends ConversationAddress {
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

/** 引用回复：正文 desktop 文本模板 + refMsgInfo（cmd100 field 11） */
export async function reply(ctx: SendContext, options: ReplyOptions): Promise<SendMessageResponse> {
  const payload = buildReplyPayload({
    text: options.text,
    referencedMessageId: options.referencedMessageId,
    referencedMessageType: options.referencedMessageType,
    referencedUid: options.referencedUid,
    ...(options.referencedSecUid ? { referencedSecUid: options.referencedSecUid } : {}),
    ...(options.nickname ? { nickname: options.nickname } : {}),
    ...(options.referencedText ? { referencedText: options.referencedText } : {}),
    ...(options.rootMessageId ? { rootMessageId: options.rootMessageId } : {}),
    ...(options.rootMessageConvIndex ? { rootMessageConvIndex: options.rootMessageConvIndex } : {})
  });

  return await send(ctx, {
    ...options,
    content: payload.content,
    messageType: 7,
    reference: payload.reference
  });
}

/** body.sendMessageBody 解析：serverMessageId/status/checkCode/checkMessage */
function parseSendResponse(decoded: Record<string, unknown>, clientMessageId: string): SendMessageResponse {
  const statusCode = Number(decoded['statusCode'] ?? 0);
  const body = decoded['body'] as Record<string, unknown> | undefined;
  const sendBody = body?.['sendMessage'] as
    | {
        status?: number;
        serverMessageId?: string | number;
        clientMessageId?: string;
        checkCode?: string | number;
        checkMessage?: string;
      }
    | undefined;

  const rawCheckCode = Number(sendBody?.checkCode ?? 0);
  let checkCode = rawCheckCode > 0 ? rawCheckCode : undefined;
  let checkTips = '';

  if (sendBody?.checkMessage) {
    try {
      const check = JSON.parse(sendBody.checkMessage) as { status_code?: number; tips?: string };

      if (Number(check.status_code) > 0) {
        checkCode = Number(check.status_code);
      }
      checkTips = String(check.tips ?? '');
    } catch {
      /* 非 JSON 保持原值 */
    }
  }

  const sendStatus = Number(sendBody?.status ?? 0);
  const serverMessageId = sendBody?.serverMessageId !== null && sendBody?.serverMessageId !== undefined ? String(sendBody.serverMessageId) : undefined;
  const envelopeMsg = String(decoded['errorDesc'] ?? '');
  const delivered = statusCode === 0 && sendStatus === 0 && !!serverMessageId && serverMessageId !== '0';

  if (!delivered) {
    return {
      statusCode: statusCode || sendStatus || -1,
      statusMsg: checkTips || envelopeMsg || 'send rejected',
      clientMessageId,
      ...(checkCode !== undefined ? { checkCode } : {})
    };
  }

  return {
    statusCode: 0,
    statusMsg: envelopeMsg,
    serverMessageId,
    clientMessageId: sendBody?.clientMessageId ?? clientMessageId,
    ...(checkCode !== undefined ? { checkCode } : {})
  };
}
