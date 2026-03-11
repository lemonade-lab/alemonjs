export type Message = {
  /**
   * 消息编号
   */
  MessageId: string;
  /**
   * 当消息是回复时，携带 ReplyId
   */
  ReplyId?: string;
};

export type MessageText = {
  /**
   * 消息文本
   */
  MessageText: string;
};

export type MessageOpen = {
  /**
   * 开放编号
   */
  OpenId: string;
};

/**
 * 媒体项
 */
export type MessageMediaItem = {
  /**
   * 媒体类型
   */
  Type: 'image' | 'audio' | 'video' | 'file' | 'sticker' | 'animation';
  /**
   * 媒体URL
   */
  Url?: string;
  /**
   * 文件标识
   */
  FileId?: string;
  /**
   * 文件名
   */
  FileName?: string;
  /**
   * 文件大小(bytes)
   */
  FileSize?: number;
  /**
   * MIME类型
   */
  MimeType?: string;
};

/**
 * 媒体消息
 */
export type MessageMedia = {
  /**
   * 媒体消息列表
   */
  MessageMedia?: MessageMediaItem[];
};
