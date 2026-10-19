//#region src/types/message/link.d.ts
/**
 * 文本数据
 */
type DataLink = {
  type: 'Link';
  value: string;
  options?: {
    link: string;
  };
};
//#endregion
export { DataLink };