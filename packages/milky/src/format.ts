import type { DataEnums, DataMarkDown, MessageMediaItem } from 'alemonjs';
import { readFileSync } from 'fs';
import type { MilkySegment } from './sdk/types';

/**
 * 提取 Milky IncomingSegment 数组中的文本。
 */
export const milkySegmentsToText = (segments: MilkySegment[] = []): string => {
  return segments
    .filter(item => item.type === 'text')
    .map(item => String(item.data?.text ?? ''))
    .join('')
    .trim();
};

/**
 * 将 Milky IncomingSegment 数组中的媒体段转为标准 MessageMedia。
 */
export const milkySegmentsToMedia = (segments: MilkySegment[] = []): MessageMediaItem[] => {
  const media: MessageMediaItem[] = [];

  for (const item of segments) {
    const d = item.data ?? {};

    if (item.type === 'image') {
      media.push({
        Type: 'image',
        Url: d.temp_url || d.url,
        FileId: d.resource_id,
        FileName: d.file_name,
        FileSize: d.file_size ? Number(d.file_size) : undefined
      });
    } else if (item.type === 'record') {
      media.push({
        Type: 'audio',
        Url: d.temp_url || d.url,
        FileId: d.resource_id,
        FileName: d.file_name,
        FileSize: d.file_size ? Number(d.file_size) : undefined
      });
    } else if (item.type === 'video') {
      media.push({
        Type: 'video',
        Url: d.temp_url || d.url,
        FileId: d.resource_id,
        FileName: d.file_name,
        FileSize: d.file_size ? Number(d.file_size) : undefined
      });
    } else if (item.type === 'file') {
      media.push({
        Type: 'file',
        FileId: d.file_id,
        FileName: d.file_name,
        FileSize: d.file_size ? Number(d.file_size) : undefined
      });
    }
  }

  return media;
};

/**
 * 提取回复引用的 message_seq。
 */
export const findReplyId = (segments: MilkySegment[] = []): string | undefined => {
  const reply = segments.find(item => item.type === 'reply');

  if (!reply) {
    return undefined;
  }

  return String(reply.data?.message_seq ?? '');
};

/**
 * 判断群消息是否 at 了机器人。
 */
export const isMilkyAtBot = (segments: MilkySegment[] = [], selfId: string) => {
  return segments.some(item => item.type === 'mention' && String(item.data?.user_id ?? '') === String(selfId));
};

/**
 * 规范化文件 URI，支持 file:// http(s):// base64:// 与 Buffer。
 */
export const fixUri = (uri: any): string => {
  if (!uri) {
    return uri;
  }

  if (Buffer.isBuffer(uri)) {
    return `base64://${uri.toString('base64')}`;
  }

  if (typeof uri === 'object' && uri.type === 'Buffer' && Array.isArray(uri.data)) {
    return `base64://${Buffer.from(uri.data).toString('base64')}`;
  }

  if (typeof uri !== 'string') {
    return String(uri);
  }

  let res = uri;

  if (res.startsWith('base64://')) {
    const data = res.substring(9);
    const pad = data.length % 4;

    if (pad > 0) {
      res += '='.repeat(4 - pad);
    }

    return res;
  }

  if (/^[a-zA-Z]:(\\|\/)/.test(res) || (res.startsWith('/') && !res.startsWith('//'))) {
    return `file://${res}`;
  }

  return res;
};

/**
 * 将结构化 Markdown 子元素数组转为可读纯文本。
 */
export const markdownToText = (items: DataMarkDown['value'] = []): string => {
  return items
    .map(item => {
      switch (item.type) {
        case 'MD.text':
        case 'MD.title':
        case 'MD.subtitle':
        case 'MD.bold':
        case 'MD.italic':
        case 'MD.italicStar':
        case 'MD.strikethrough':
        case 'MD.code':
        case 'MD.content':
          return item.value;
        case 'MD.link': {
          const v = item.value as unknown as { text: string; url?: string };

          return v.url ? `${v.text}( ${v.url} )` : v.text;
        }
        case 'MD.image':
          return '[图片]';
        case 'MD.list':
          return item.value
            .map(li => {
              if (typeof li.value === 'object') {
                return `${li.value.index}. ${li.value.text ?? ''}`;
              }

              return `· ${li.value}`;
            })
            .join('\n');
        case 'MD.blockquote':
          return `> ${item.value}\n`;
        case 'MD.divider':
          return '————————\n';
        case 'MD.newline':
          return '\n';
        case 'MD.mention':
          if (item.value === 'everyone') {
            return '@全体成员';
          }

          return `@${item.value ?? ''}`;
        case 'MD.button':
          return `[${item.value}]`;
        default:
          return String((item as any)?.value ?? '');
      }
    })
    .join('');
};

/**
 * 将 DataEnums 数组转为 Milky OutgoingSegment 数组。
 *
 * Milky 原生支持 text / mention / mention_all / face / reply /
 * image / record / video / forward / light_app。
 */
export const dataEnumToMilkyMessage = (val: DataEnums[] = []) => {
  const message = val
    .map(item => {
      if (item.type === 'Text') {
        return {
          type: 'text',
          data: { text: String(item.value ?? '') }
        } as MilkySegment;
      }

      if (item.type === 'Mention') {
        if (item.value === 'everyone' || item.value === 'all' || item.value === '' || (typeof item.value !== 'string' && typeof item.value !== 'number')) {
          return { type: 'mention_all', data: {} } as MilkySegment;
        }

        if (item.options?.belong === 'everyone') {
          return { type: 'mention_all', data: {} } as MilkySegment;
        }

        return {
          type: 'mention',
          data: { user_id: Number(item.value) }
        } as MilkySegment;
      }

      if (item.type === 'Image') {
        return {
          type: 'image',
          data: { uri: fixUri(item.value), sub_type: 'normal' }
        } as MilkySegment;
      }

      if (item.type === 'ImageURL') {
        return {
          type: 'image',
          data: { uri: item.value, sub_type: 'normal' }
        } as MilkySegment;
      }

      if (item.type === 'ImageFile') {
        const db = readFileSync(item.value);

        return {
          type: 'image',
          data: { uri: `base64://${db.toString('base64')}`, sub_type: 'normal' }
        } as MilkySegment;
      }

      if (item.type === 'Audio') {
        return {
          type: 'record',
          data: { uri: fixUri(item.value) }
        } as MilkySegment;
      }

      if (item.type === 'Video') {
        return {
          type: 'video',
          data: {
            uri: fixUri(item.value),
            thumb_uri: (item as any).options?.thumb ? fixUri((item as any).options.thumb) : undefined
          }
        } as MilkySegment;
      }

      if (item.type === 'Attachment') {
        const filename = (item as any).options?.filename;

        return {
          type: 'text',
          data: { text: filename ? `[附件: ${filename}]` : '[附件]' }
        } as MilkySegment;
      }

      // 降级处理：将 Link、Markdown、Button、Select、Embed 等转为纯文本
      let text = '';

      if (item.type === 'Link') {
        const link = (item as any).options?.link;

        text = link ? `${item.value}( ${link} )` : String(item.value);
      } else if (item.type === 'Markdown') {
        text = markdownToText((item as any).value);
      } else if (item.type === 'MarkdownOriginal') {
        text = String(item.value ?? '');
      } else if (item.type === 'ButtonGroup' || item.type === 'BT.group') {
        text = ((item as any).value || []).map((row: any) => (row.value || []).map((btn: any) => `[${btn.value}]`).join(' ')).join('\n');
      } else if (item.type === 'Select') {
        text = ((item as any).value || [])
          .map((opt: any) => opt?.label ?? opt?.value ?? '')
          .filter(Boolean)
          .join(' / ');
      } else if (item.type === 'Embed') {
        const v = (item as any).value || {};

        text = v.description || v.title || '';
      }

      if (text.trim()) {
        return { type: 'text', data: { text: text.trim() } } as MilkySegment;
      }

      return null;
    })
    .flat();

  return message.filter((item): item is MilkySegment => Boolean(item));
};
