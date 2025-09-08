/**
 * 文本数据
 */
export type DataText = {
  type: 'Text';
  value: string;
  options?: {
    style?: 'none' | 'bold' | 'block' | 'strikethrough' | 'boldItalic' | 'italic';
  };
};
