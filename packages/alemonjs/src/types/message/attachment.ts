/**
 * 附件数据
 * value 为带协议的字符串：https:// | http:// | file:// | base64://
 */
export type DataAttachment = {
  type: 'Attachment';
  value: string;
  options?: {
    filename?: string;
  };
};
