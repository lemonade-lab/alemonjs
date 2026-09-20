import { createHash } from 'crypto';
import { readFileSync, statSync } from 'fs';
import type { QQBotAPI } from './sdk/api';
import { FileType } from './sdk/typing';

/**
 * 分片上传辅助
 * 流程：upload_prepare 拿 upload_id 与每片 presigned_url
 * → 分片字节 PUT 直传 COS 预签名地址
 * → 每片成功后 upload_part_finish 上报
 * → 全部完成后 postRichMediaByUser/ByGroup 携带 upload_id 合并，得到 file_info
 */

/**
 * 大文件分片上传阈值（字节），即 md5_10m 计算区间大小（约 10MB）
 */
export const CHUNK_THRESHOLD = 10002432;

/**
 * 将 file_data（base64 字符串或 Buffer）转为 Buffer
 * @param fileData 文件数据
 */
export const fileDataToBuffer = (fileData: any): Buffer | null => {
  if (!fileData) {
    return null;
  }
  if (Buffer.isBuffer(fileData)) {
    return fileData;
  }
  if (typeof fileData === 'string') {
    if (fileData.indexOf('base64://') === 0) {
      return Buffer.from(fileData.replace('base64://', ''), 'base64');
    }

    return Buffer.from(fileData, 'base64');
  }

  return null;
};

/**
 * 计算文件摘要
 * @param filePath 本地文件路径
 */
export const computeFileDigests = (filePath: string) => {
  const buffer = readFileSync(filePath);
  const md5 = createHash('md5').update(buffer).digest('hex');
  const sha1 = createHash('sha1').update(buffer).digest('hex');
  // 文件前 10002432 字节（约 10MB）的 MD5
  const md5Head = createHash('md5').update(buffer.subarray(0, CHUNK_THRESHOLD)).digest('hex');

  return { buffer, md5, sha1, md5_10m: md5Head };
};

/**
 * 分片上传完整流程
 * @param client QQBot API 客户端
 * @param scope user 单聊 / group 群聊
 * @param openId 用户或群的 OpenID
 * @param file 本地文件路径或文件内容
 * @param options 上传选项
 */
export const chunkedUpload = (
  client: QQBotAPI,
  scope: 'user' | 'group',
  openId: string,
  file: string | Buffer,
  options: {
    file_type: FileType;
    file_name?: string;
    srv_send_msg?: boolean;
  }
) => {
  return client.postChunkedRichMedia({
    scope: scope === 'user' ? 'c2c' : 'group',
    targetId: openId,
    fileType: options.file_type,
    ...(typeof file === 'string' ? { filePath: file, size: statSync(file).size } : { data: file }),
    name: options.file_name ?? (typeof file === 'string' ? file.split(/[\\/]/).pop() : undefined),
    send: options.srv_send_msg
  });
};
