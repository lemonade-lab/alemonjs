//#region src/types/message/audio.d.ts
/**
 * 音频数据
 * value 为带协议的字符串：https:// | http:// | file:// | base64://
 */
type DataAudio = {
  type: 'Audio';
  value: string;
};
//#endregion
export { DataAudio };