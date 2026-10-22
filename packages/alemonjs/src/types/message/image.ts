/**
 * 图片数据
 * value 为带协议的字符串：https:// | http:// | file:// | base64://
 */
export type DataImage = {
  type: 'Image';
  /** Structured input resolved before sending. Legacy value remains a string. */
  media?: import('../media-resource').MediaImage;
  value: string;
};

/**
 * 图片链接
 */
export type DataImageURL = {
  type: 'ImageURL';
  value: string;
};

/**
 * 图片文件
 */
export type DataImageFile = {
  type: 'ImageFile';
  value: string;
};
