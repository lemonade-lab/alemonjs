/**
 * 视频数据
 * value 为带协议的字符串：https:// | http:// | file:// | base64://
 */
export type DataVideo = {
  type: 'Video';
  value: string;
};
