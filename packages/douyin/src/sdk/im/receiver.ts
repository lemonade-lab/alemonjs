// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
import { logger } from '../logger.js';
import { decodeWire, decodeWireTree, type WireField } from './protocol/index.js';
import { fieldString } from './notifications.js';
import { displayText, parseMessageContent } from './content.js';
import type { InboundMessage, NoticeEvent, PushMessage } from './types.js';

/** 原始推送 → 业务入站消息（附加解析内容与展示文本） */
export function toInboundMessage(push: PushMessage): InboundMessage {
  const parsed = parseMessageContent(push.content, push.messageType);

  // 未识别的消息类型：打印原始响应辅助逆向
  if (parsed.kind === 'unknown') {
    logger.debug(
      `[douyin:im] 未识别消息: cmd=${push.cmd} messageType=${push.messageType ?? '-'} ` +
        `conversationId=${push.conversationId} content=${push.content.slice(0, 600)}`
    );
  }

  return {
    ...push,
    parsed,
    text: displayText(push.content, push.messageType)
  };
}

/* ---------------------------------------------------------------------------
 * Android Frontier 无 schema 消息提取（对齐 douyin-im android-ws.ts collectMessages）
 * 群聊（纯数字 conversationId）与私聊（0:1:xxx:xxx）均走此路径。
 * ------------------------------------------------------------------------- */

interface MessageContext {
  cmd?: number;
  inboxType?: number;
  conversationId?: string;
  senderUid?: string;
  senderSecUid?: string;
  conversationShortId?: string;
  serverMessageId?: string;
  indexInConversation?: string;
  indexInConversationV2?: string;
  createTime?: string;
  reference?: NonNullable<PushMessage['reference']>;
}

/**
 * 无 schema 提取嵌套引用信息（同 cmd=100 refMsgInfo 同构字段序）：
 * field 1 = referencedMessageId（int64 → varint），field 2 = hint JSON（含 refmsg_type 等键），field 3 = rootMessageId
 */
function extractReference(fields: WireField[]): NonNullable<PushMessage['reference']> | undefined {
  for (const field of fields) {
    if (field.type !== 'message') {
      continue;
    }
    const hint = field.value.find(item => item.type === 'string' && item.value.includes('refmsg_type'))?.value as string | undefined;

    if (!hint) {
      continue;
    }
    const varint = (num: number): string | undefined => {
      const hit = field.value.find(item => item.type === 'varint' && item.field === num)?.value as bigint | undefined;

      return hit !== undefined ? hit.toString() : undefined;
    };
    const refId = varint(1) ?? (field.value.find(item => item.type === 'string' && /^\d{10,}$/.test(item.value))?.value as string | undefined);

    if (!refId) {
      continue;
    }
    const rootMessageId = varint(3);

    return {
      referencedMessageId: refId,
      hint,
      ...(rootMessageId ? { rootMessageId } : {})
    };
  }

  return undefined;
}

function collectMessages(fields: WireField[], output: PushMessage[], rawTree: unknown, inherited: MessageContext = {}): void {
  const strings = fields
    .filter((item): item is Extract<WireField, { type: 'string' }> => item.type === 'string')
    .map(item => ({ field: item.field, value: item.value }));
  const context: MessageContext = { ...inherited };
  const envelopeCmd = fieldString(fields, 1);
  const envelopeInboxType = fieldString(fields, 5);

  if (envelopeCmd && envelopeInboxType && (envelopeInboxType === '0' || envelopeInboxType === '1')) {
    context.cmd = Number(envelopeCmd);
    context.inboxType = Number(envelopeInboxType);
  }
  const conversationId =
    strings.find(({ value }) => /^0:1:\d+:\d+$/.test(value))?.value ?? strings.find(({ field, value }) => field === 1 && /^\d+$/.test(value))?.value;

  if (conversationId) {
    context.conversationId = conversationId;
  }
  const senderUid = fieldString(fields, 7);

  // 抖音 uid 至少 15 位数字；短数字（如回显帧中的 50013）是其他字段，不能当 sender
  if (senderUid && senderUid.length >= 15 && /^\d+$/.test(senderUid)) {
    context.senderUid = senderUid;
  }
  const senderSecUid = fieldString(fields, 14);

  if (senderSecUid?.startsWith('MS4')) {
    context.senderSecUid = senderSecUid;
  }
  const shortId = fieldString(fields, 5);

  if ((conversationId || senderUid) && shortId && /^\d+$/.test(shortId)) {
    context.conversationShortId = shortId;
  }
  const serverMessageId = fieldString(fields, 3);

  if ((conversationId || senderUid) && serverMessageId && /^\d+$/.test(serverMessageId)) {
    context.serverMessageId = serverMessageId;
  }
  const indexInConversation = fieldString(fields, 4);

  if ((conversationId || senderUid) && indexInConversation) {
    context.indexInConversation = indexInConversation;
  }
  const indexInConversationV2 = fieldString(fields, 17);

  if ((conversationId || senderUid) && indexInConversationV2) {
    context.indexInConversationV2 = indexInConversationV2;
  }
  const createTime = fieldString(fields, 10);

  if ((conversationId || senderUid) && createTime) {
    context.createTime = createTime;
  }
  const reference = extractReference(fields);

  if ((conversationId || senderUid) && reference) {
    context.reference = reference;
  }
  const contentField = fields.find(
    (item): item is Extract<WireField, { type: 'string' }> =>
      item.type === 'string' && (item.field === 8 || item.field === 6) && item.value.trimStart().startsWith('{')
  );

  if (context.conversationId && context.senderUid && contentField) {
    output.push({
      cmd: context.cmd ?? 500,
      ...(context.inboxType !== undefined ? { inboxType: context.inboxType } : {}),
      conversationId: context.conversationId,
      conversationShortId: context.conversationShortId ?? '',
      conversationType: /^\d+$/.test(context.conversationId) ? 2 : 1,
      senderUid: context.senderUid,
      ...(context.senderSecUid ? { senderSecUid: context.senderSecUid } : {}),
      content: contentField.value,
      messageType: Number(fieldString(fields, 6) ?? 7),
      ...(context.serverMessageId ? { serverMessageId: context.serverMessageId } : {}),
      ...(context.indexInConversation ? { indexInConversation: context.indexInConversation } : {}),
      ...(context.indexInConversationV2 ? { indexInConversationV2: context.indexInConversationV2 } : {}),
      ...(context.createTime ? { createTime: context.createTime } : {}),
      ...(context.reference ? { reference: context.reference } : {}),
      raw: { transport: 'android-frontier', content: contentField.value, wireTree: rawTree }
    });
  }
  for (const field of fields) {
    if (field.type === 'message') {
      collectMessages(field.value, output, rawTree, context);
    }
  }
}

/** Android Frontier payload 的无 schema 消息提取 */
export function extractAndroidPushes(payload: Uint8Array): PushMessage[] {
  const output: PushMessage[] = [];
  const fields = decodeWire(payload);
  const tree = decodeWireTree(payload);

  collectMessages(fields, output, tree);
  const unique = new Map<string, PushMessage>();

  for (const message of output) {
    unique.set(`${message.serverMessageId ?? ''}|${message.conversationId}|${message.senderUid}|${message.content}`, message);
  }

  return [...unique.values()];
}

/** varint 字段值（bigint → string） */
function fieldVarint(fields: WireField[], field: number): string | undefined {
  const hit = fields.find(item => item.type === 'varint' && item.field === field)?.value as bigint | undefined;

  return hit?.toString();
}

/**
 * cmd=500 field=500 property 推送 → 消息表情回应（ModifyPropertyBody 同构下发）：
 * f1=conversation_id, f2=conversation_type, f3=conversation_short_id, f4=server_message_id,
 * f5=client_message_id, f6=repeated ModifyPropertyContent{operation=1,key=2,value=3,idempotent_id=4}
 */
export function extractReactions(payload: Uint8Array): NoticeEvent[] {
  const events: NoticeEvent[] = [];
  const visit = (fields: WireField[]): void => {
    for (const item of fields) {
      if (item.type === 'message') {
        visit(item.value);
      }
      if (item.type !== 'message' || item.field !== 500) {
        continue;
      }
      for (const body of item.value.filter(inner => inner.type === 'message' && inner.field === 5)) {
        const list = body.value as Extract<WireField, { type: 'message' }>['value'];
        const conversationId = list.find(inner => inner.type === 'string' && inner.field === 1)?.value as string | undefined;
        // serverMessageId 为 19 位 int64；短于 18 位的是 shortId 之类字段
        const bigId = (field: number): string | undefined => {
          const value = fieldVarint(list, field);

          return value && value.length >= 18 ? value : undefined;
        };
        const serverMessageId = bigId(4) ?? bigId(3);

        if (!conversationId || !serverMessageId) {
          continue;
        }
        for (const content of list.filter(inner => inner.type === 'message' && inner.field === 6)) {
          const inner = (content as Extract<WireField, { type: 'message' }>).value;
          const operation = Number(fieldVarint(inner, 1) ?? '0');
          const rawKey = inner.find(el => el.type === 'string' && el.field === 2)?.value as string | undefined;
          const operatorUid = inner.find(el => el.type === 'string' && el.field === 4)?.value as string | undefined;

          // 表态 key 形如 se:[爱心]；容忍其他前缀
          if (!rawKey?.includes(':')) {
            continue;
          }
          events.push({
            type: 'message.reaction',
            conversationId,
            serverMessageId,
            emoji: rawKey.replace(/^se:/, ''),
            operatorUid: operatorUid ?? '',
            isSet: operation === 0,
            raw: {}
          });
        }
      }
    }
  };

  visit(decodeWire(payload));

  return events;
}
