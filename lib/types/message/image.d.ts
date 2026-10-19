//#region src/types/message/image.d.ts
/**
 * 图片数据
 * value 为带协议的字符串：https:// | http:// | file:// | base64://
 */
type DataImage = {
  type: 'Image';
  value: string;
};
/**
 * 图片链接
 */
type DataImageURL = {
  type: 'ImageURL';
  value: string;
};
/**
 * 图片文件
 */
type DataImageFile = {
  type: 'ImageFile';
  value: string;
};
//#endregion
export { DataImage, DataImageFile, DataImageURL };