//#region src/types/message/video.d.ts
/**
 * 视频数据
 * value 为带协议的字符串：https:// | http:// | file:// | base64://
 */
type DataVideo = {
  type: 'Video';
  value: string;
};
//#endregion
export { DataVideo };