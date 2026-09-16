// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
import type { ImClient, InboundMessage, ConversationAddress } from '../im/index.js';
import type { ForwardNode } from '../im/types.js';
import type { ReplyOptions, TextMention } from '../im/index.js';
import { parseMessageContent } from '../im/content.js';

/** 发送文本（可带 @ 提及） */
export async function sendText(client: ImClient, address: ConversationAddress, text: string, mentions?: TextMention[]) {
  return await client.sendText(address, text, mentions);
}

/** 合并转发（136）：nodes 已构造（fake 节点由 buildForwardNodes 转换） */
export async function sendForwardNodes(client: ImClient, address: ConversationAddress, nodes: ForwardNode[], selfUid: string, selfSecUid?: string) {
  return await client.sendMergeForward({
    ...address,
    nodes,
    selfUid,
    ...(selfSecUid ? { selfSecUid } : {})
  });
}

/** 发送图片：data 为原始字节（已上传前的 Buffer/Uint8Array） */
export async function sendImage(client: ImClient, address: ConversationAddress, data: Uint8Array) {
  const asset = await client.uploadImage(data);

  return client.sendMedia({ ...address, image: asset });
}

/** 发送视频 */
export async function sendVideo(client: ImClient, address: ConversationAddress, data: Uint8Array, poster: Uint8Array, width: number, height: number) {
  const asset = await client.uploadVideo(data);
  const posterAsset = await client.uploadImage(poster);

  return client.sendMedia({ ...address, video: { asset, poster: posterAsset, width, height } });
}

/** 发送文件：data 为原始字节，name 为文件名（≤10MiB） */
export async function sendFile(client: ImClient, address: ConversationAddress, data: Uint8Array, name: string) {
  const asset = await client.uploadFile(data, name);

  return client.sendMedia({ ...address, file: asset });
}

/** 引用回复（cmd=100 + refMsgInfo，引用信息已补全） */
export async function reply(client: ImClient, options: ReplyOptions) {
  return await client.reply(options);
}

export type { ReplyOptions };

/** 撤回 */
export async function recall(client: ImClient, address: ConversationAddress, messageId: string) {
  return await client.recall({ ...address, serverMessageId: messageId });
}

/** 历史消息（cursor = indexInConversation 游标，0 表示最新） */
export interface HistoryOptions {
  cursor?: string | number;
  count?: number;
  messageId?: string;
}

export async function getHistory(client: ImClient, address: ConversationAddress, options: HistoryOptions = {}) {
  let cursor = options.cursor;

  if (options.messageId) {
    const found = await getMessage(client, address, options.messageId);

    cursor = found.indexInConversation;
    if (!cursor) {
      throw new Error('The referenced message has no history cursor');
    }
  }

  return await client.getChatHistory({ ...address, cursor, count: options.count });
}

/** Resolve a message from the latest 60 messages, like the reference adapter. */
export async function getMessage(client: ImClient, address: ConversationAddress, messageId: string) {
  const history = await client.getChatHistory({ ...address, count: 60 });
  const found = history.find(item => item.msgId === messageId);

  if (!found) {
    throw new Error(`Message not found in recent history: ${messageId}`);
  }

  return found;
}

/** Read merged-forward nodes from a message in an existing conversation. */
export async function getForwardMessage(client: ImClient, address: ConversationAddress, messageId: string) {
  const found = await getMessage(client, address, messageId);
  const parsed = parseMessageContent(found.content, found.msgType);

  if (parsed.kind !== 'forward') {
    throw new Error('Message is not a merged forward');
  }

  return parsed.nodes;
}

export type { InboundMessage };
