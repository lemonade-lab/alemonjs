import { createResult, ResultCode } from 'alemonjs';
import { createHash, randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { WeChatClient, Logger } from './client.js';
import { markdownToText } from './format.js';

export const getFileBuffer = async (file: string | Buffer): Promise<{ buffer: Buffer; fileName: string }> => {
  if (Buffer.isBuffer(file)) {
    return { buffer: file, fileName: 'file' };
  }

  if (typeof file === 'string') {
    if (file.startsWith('http://') || file.startsWith('https://')) {
      const response = await fetch(file);
      const buffer = Buffer.from(await response.arrayBuffer());
      const fileName = path.basename(new URL(file).pathname) || 'file';

      return { buffer, fileName };
    } else if (file.startsWith('base64://')) {
      const base64Data = file.replace(/^base64:\/\//, '');
      const buffer = Buffer.from(base64Data, 'base64');

      return { buffer, fileName: 'base64_file' };
    } else if (file.startsWith('file://')) {
      const filePath = file.replace(/^file:\/\//, '');
      const buffer = await readFile(filePath);

      return { buffer, fileName: path.basename(filePath) };
    } else {
      const buffer = await readFile(file);

      return { buffer, fileName: path.basename(file) };
    }
  }

  throw new Error('Invalid file type');
};

export const detectMediaType = (fileName: string, buffer: Buffer): { mediaType: number; itemType: number } => {
  let mediaType = 3;
  let itemType = 4;

  const ext = path.extname(fileName).toLowerCase();

  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) {
    mediaType = 1;
    itemType = 2;
  } else if (['.mp4', '.avi', '.mov', '.mkv', '.flv'].includes(ext)) {
    mediaType = 2;
    itemType = 5;
  } else if (['.mp3', '.wav', '.ogg', '.aac', '.m4a', '.amr', '.silk'].includes(ext)) {
    mediaType = 4;
    itemType = 3;
  }

  if (buffer.length > 4) {
    const header = buffer.subarray(0, 4).toString('hex');

    if (
      header.startsWith('ffd8ff') ||
      header.startsWith('89504e47') ||
      header.startsWith('47494638') ||
      header.startsWith('52494646') ||
      header.startsWith('57454250')
    ) {
      mediaType = 1;
      itemType = 2;
    }
  }

  return { mediaType, itemType };
};

export const uploadMedia = async (client: WeChatClient, file: string | Buffer, toUserId: string, logger: Logger): Promise<any> => {
  const { buffer, fileName } = await getFileBuffer(file);
  const { mediaType, itemType } = detectMediaType(fileName, buffer);

  const fileKey = randomBytes(16).toString('hex');
  const aesKey = randomBytes(16);
  const aesKeyHex = aesKey.toString('hex');
  const rawMd5 = createHash('md5').update(buffer).digest('hex');
  const cipherSize = Math.ceil((buffer.length + 1) / 16) * 16;

  logger.debug('Uploading media:', { fileName, mediaType, itemType, rawSize: buffer.length });

  const uploadUrlRes = await client.getUploadUrl({
    filekey: fileKey,
    media_type: mediaType,
    to_user_id: toUserId,
    rawsize: buffer.length,
    rawfilemd5: rawMd5,
    filesize: cipherSize,
    no_need_thumb: true,
    aeskey: aesKeyHex
  });

  const uploadParam = uploadUrlRes.upload_param;
  const uploadFullUrl = uploadUrlRes.upload_full_url;

  const encryptedParam = await client.uploadToCdn(uploadFullUrl, uploadParam, fileKey, aesKeyHex, buffer);

  logger.debug('Upload result:', {
    uploadFullUrl: uploadFullUrl || null,
    uploadParam: uploadParam || null,
    encryptedParamLength: encryptedParam?.length ?? 0,
    encryptedParamHead: encryptedParam?.slice(0, 64) || ''
  });

  const aesKeyB64 = Buffer.from(aesKeyHex, 'utf8').toString('base64');

  return {
    media: {
      encrypt_query_param: encryptedParam,
      aes_key: aesKeyB64,
      encrypt_type: 1
    },
    itemType,
    rawSize: buffer.length,
    // iLink expects the ciphertext size for image_item.mid_size / video_item.video_size
    cipherSize,
    fileName
  };
};

export const formatToItemList = async (val: any[], toUserId: string, client: WeChatClient, logger: Logger): Promise<any[]> => {
  const itemList: any[] = [];

  for (const item of val) {
    if (!item) {
      continue;
    }

    switch (item.type) {
      case 'Text':
        if (item.value) {
          itemList.push({ type: 1, text_item: { text: item.value } });
        }
        break;

      case 'Markdown':
        if (typeof item.value === 'string') {
          itemList.push({ type: 1, text_item: { text: item.value } });
        } else if (Array.isArray(item.value)) {
          const mdText = markdownToText(item.value);

          if (mdText) {
            itemList.push({ type: 1, text_item: { text: mdText } });
          }
        }
        break;

      case 'MarkdownOriginal':
        if (typeof item.value === 'string' && item.value) {
          itemList.push({ type: 1, text_item: { text: item.value } });
        }
        break;

      case 'Image':
      case 'ImageFile':
      case 'ImageURL':
        try {
          const result = await uploadMedia(client, item.value, toUserId, logger);

          itemList.push({
            type: result.itemType,
            image_item: {
              media: result.media,
              mid_size: result.cipherSize
            }
          });
        } catch (err) {
          logger.error('Upload image failed:', err);
          itemList.push({ type: 1, text_item: { text: '[图片上传失败]' } });
        }
        break;

      case 'Audio':
        try {
          const result = await uploadMedia(client, item.value, toUserId, logger);

          itemList.push({
            type: result.itemType,
            voice_item: {
              media: result.media
            }
          });
        } catch (err) {
          logger.error('Upload audio failed:', err);
          itemList.push({ type: 1, text_item: { text: '[语音上传失败]' } });
        }
        break;

      case 'Video':
        try {
          const result = await uploadMedia(client, item.value, toUserId, logger);

          itemList.push({
            type: result.itemType,
            video_item: {
              media: result.media,
              video_size: result.cipherSize
            }
          });
        } catch (err) {
          logger.error('Upload video failed:', err);
          itemList.push({ type: 1, text_item: { text: '[视频上传失败]' } });
        }
        break;

      case 'Attachment':
        try {
          const result = await uploadMedia(client, item.value, toUserId, logger);

          itemList.push({
            type: result.itemType,
            file_item: {
              media: result.media,
              file_name: result.fileName,
              len: String(result.rawSize)
            }
          });
        } catch (err) {
          logger.error('Upload file failed:', err);
          itemList.push({ type: 1, text_item: { text: '[文件上传失败]' } });
        }
        break;

      case 'MD.title':
      case 'MD.subtitle':
      case 'MD.text':
      case 'MD.bold':
      case 'MD.divider':
      case 'MD.italic':
      case 'MD.italicStar':
      case 'MD.strikethrough':
      case 'MD.blockquote':
      case 'MD.newline':
      case 'MD.link':
      case 'MD.mention':
      case 'MD.content':
      case 'MD.list':
      case 'MD.code':
        const mdText = markdownToText([item]);

        if (mdText) {
          itemList.push({ type: 1, text_item: { text: mdText } });
        }
        break;
    }
  }

  return itemList;
};

export const SEND_MESSAGE = async (client: WeChatClient, userId: string, val: any[], logger: Logger): Promise<any[]> => {
  if (!val || val.length <= 0) {
    return [];
  }

  const contextToken = client.getContextToken();

  if (!contextToken) {
    logger.error('No context token available for user:', userId);

    return [createResult(ResultCode.Fail, 'No context token available', null)];
  }

  try {
    logger.info(`Sending message to ${userId}`);

    const itemList = await formatToItemList(val, userId, client, logger);

    if (itemList.length === 0) {
      return [createResult(ResultCode.Warn, 'No valid message content', null)];
    }

    logger.debug('Outbound item_list:', JSON.stringify(itemList));

    // Media items are sent one per message (iLink rejects mixed text+media lists with invalid arguments)
    const textItems = itemList.filter(item => item.type === 1);
    const mediaItems = itemList.filter(item => item.type !== 1);

    if (textItems.length > 0) {
      await client.sendMessage(userId, textItems, contextToken);
    }

    for (const item of mediaItems) {
      await client.sendMessage(userId, [item], contextToken);
    }

    return [createResult(ResultCode.Ok, 'Message sent', null)];
  } catch (error) {
    logger.error('Failed to send message:', error);

    return [createResult(ResultCode.Fail, 'Failed to send message', error)];
  }
};
