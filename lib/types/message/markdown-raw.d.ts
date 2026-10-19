//#region src/types/message/markdown-raw.d.ts
/**
 * 纯 Markdown 文本数据
 * value 为原始 Markdown 字符串
 */
type DataMarkdownOriginal = {
  type: 'MarkdownOriginal';
  value: string;
};
//#endregion
export { DataMarkdownOriginal };