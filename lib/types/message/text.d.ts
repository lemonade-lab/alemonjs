//#region src/types/message/text.d.ts
/**
 * 文本数据
 */
type DataText = {
  type: 'Text';
  value: string;
  options?: {
    style?: 'none' | 'bold' | 'block' | 'strikethrough' | 'boldItalic' | 'italic';
  };
};
//#endregion
export { DataText };