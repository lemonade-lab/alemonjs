import { createResult, DataEnums, ResultCode } from 'alemonjs';
import { readFileSync } from 'fs';
import { BubbleClient } from './sdk/wss';
import { formatBubbleContent } from './format';
import { getBubbleConfig } from './config';

type Client = typeof BubbleClient.prototype;

const ImageURLToBuffer = async (url: string) => {
  const arrayBuffer = await fetch(url).then(res => res.arrayBuffer());

  return Buffer.from(arrayBuffer);
};

export const sendToRoom = async (
  client: Client,
  param: {
    channel_id: string | number | null;
    thread_id?: string | number | null;
    message_id?: string | number | null;
  },
  val: DataEnums[]
) => {
  try {
    if (!val || val.length <= 0) {
      return [];
    }
    const channelId = String(param?.channel_id ?? '');
    const threadId = String(param?.thread_id ?? '');
    const messageId = param?.message_id ? String(param?.message_id) : undefined;
    // images
    const images = val.filter(item => item.type === 'Image' || item.type === 'ImageURL' || item.type === 'ImageFile');
    const hide = getBubbleConfig().hideUnsupported;
    const finalContent = formatBubbleContent(val, hide);

    // hideUnsupported 模式：检查转换后内容是否为空
    if (hide && !finalContent && images.length <= 0) {
      logger.info('[bubble] hideUnsupported: 消息内容转换后为空，跳过发送');

      return [];
    }

    if (images.length > 0) {
      let bufferData = null;

      for (let i = 0; i < images.length; i++) {
        if (bufferData) {
          break;
        }
        const item = images[i];

        if (item.type === 'Image') {
          if (Buffer.isBuffer(item.value)) {
            bufferData = item.value;
          } else if (item.value.startsWith('http://') || item.value.startsWith('https://')) {
            const res = await ImageURLToBuffer(item.value);

            bufferData = res;
          } else if (item.value.startsWith('base64://')) {
            const base64Str = item.value.slice(9); // 'base64://'.length === 9

            bufferData = Buffer.from(base64Str, 'base64');
          } else if (item.value.startsWith('file://')) {
            bufferData = readFileSync(item.value.slice(7));
          }
        } else if (item.type === 'ImageURL') {
          const res = await ImageURLToBuffer(item.value);

          bufferData = res;
        } else if (item.type === 'ImageFile') {
          bufferData = readFileSync(item.value);
        }
      }

      const uploadRes = await client.uploadFile(bufferData, undefined, { channelId, threadId, messageId: messageId });

      const fileAttachment = uploadRes?.data?.file;

      if (!fileAttachment) {
        return [createResult(ResultCode.Ok, '文件上传失败：未返回文件信息', uploadRes)];
      }

      if (channelId) {
        const res = await client.sendMessage(channelId, {
          content: finalContent,
          type: 'image',
          attachments: [fileAttachment]
        });

        return [createResult(ResultCode.Ok, '完成', res)];
      }

      if (threadId) {
        const res = await client.sendDm(threadId, {
          content: finalContent,
          type: 'image',
          attachments: [fileAttachment]
        });

        return [createResult(ResultCode.Ok, '完成', res)];
      }

      return [createResult(ResultCode.Ok, '完成', null)];
    }

    if (finalContent && finalContent.length > 0) {
      if (channelId) {
        const res = await client.sendMessage(channelId, { content: finalContent, type: 'text' });

        return [createResult(ResultCode.Ok, '完成', res)];
      }

      if (threadId) {
        const res = await client.sendDm(threadId, { content: finalContent, type: 'text' });

        return [createResult(ResultCode.Ok, '完成', res)];
      }

      return [createResult(ResultCode.Ok, '完成', null)];
    }

    return [];
  } catch (err) {
    return [createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)];
  }
};

export const sendToUser = async (
  client: Client,
  param: {
    author_id?: string | number;
    channel_id?: string | number;
    thread_id?: string | number;
    message_id?: string | number;
  },
  val: DataEnums[]
) => {
  if (!val || val.length <= 0) {
    return [];
  }

  let threadId: string | number | undefined = param?.channel_id || param?.thread_id;
  const messageId = param?.message_id;

  if (!threadId && param.author_id) {
    const dm = await client.getOrCreateDm(param.author_id);

    threadId = dm?.id;
  }

  if (!threadId) {
    return [];
  }

  return sendToRoom(client, { channel_id: null, thread_id: threadId, message_id: messageId }, val);
};

export default {};
