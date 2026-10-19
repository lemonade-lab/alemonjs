//#region src/types/message/markdown.d.ts
type DataMarkdownText = {
  type: 'MD.text';
  value: string;
};
type DataMarkdownMention = {
  type: 'MD.mention';
  value?: string | 'everyone';
  options?: {
    belong?: 'user' | 'channel';
  };
};
type DataMarkdownContent = {
  type: 'MD.content';
  value: string;
};
type DataMarkdownButton = {
  type: 'MD.button';
  value: string;
  options?: {
    toolTip?: string;
    autoEnter?: boolean;
    data?: string;
    type?: 'command' | 'link' | 'call';
  };
};
type DataMarkdownTitle = {
  type: 'MD.title';
  value: string;
};
type DataMarkdownSubtitle = {
  type: 'MD.subtitle';
  value: string;
};
type DataMarkdownBold = {
  type: 'MD.bold';
  value: string;
};
type DataMarkdownItalic = {
  type: 'MD.italic';
  value: string;
};
type DataMarkdownItalicStar = {
  type: 'MD.italicStar';
  value: string;
};
type DataMarkdownStrikethrough = {
  type: 'MD.strikethrough';
  value: string;
};
type DataMarkdownLink = {
  type: 'MD.link';
  value: {
    text: string;
    url?: string;
  };
};
type DataMarkdownImage = {
  type: 'MD.image';
  value: string;
  options?: {
    width?: number;
    height?: number;
  };
};
type DataMarkdownListItem = {
  type: 'MD.listItem';
  value: string | {
    index: number;
    text?: string;
  };
};
type DataMarkdownList = {
  type: 'MD.list';
  value: DataMarkdownListItem[];
};
type DataMarkdownBlockquote = {
  type: 'MD.blockquote';
  /** 兼容旧字符串；节点数组表示引用内部的结构化内容。 */
  value: string | DataMarkDown['value'];
};
type DataMarkdownDivider = {
  type: 'MD.divider';
};
type DataMarkdownNewline = {
  type: 'MD.newline';
  value: boolean;
};
type DataMarkdownCode = {
  type: 'MD.code';
  value: string;
  options?: {
    language?: string;
  };
};
type DataMarkDownBalue = DataMarkdownMention | DataMarkdownContent | DataMarkdownButton | DataMarkdownText | DataMarkdownTitle | DataMarkdownSubtitle | DataMarkdownBold | DataMarkdownItalic | DataMarkdownItalicStar | DataMarkdownStrikethrough | DataMarkdownLink | DataMarkdownImage | DataMarkdownList | DataMarkdownBlockquote | DataMarkdownDivider | DataMarkdownNewline | DataMarkdownCode;
type DataMarkDown = {
  type: 'Markdown';
  value: DataMarkDownBalue[];
};
//#endregion
export { DataMarkDown, DataMarkdownBlockquote, DataMarkdownBold, DataMarkdownButton, DataMarkdownCode, DataMarkdownContent, DataMarkdownDivider, DataMarkdownImage, DataMarkdownItalic, DataMarkdownItalicStar, DataMarkdownLink, DataMarkdownList, DataMarkdownListItem, DataMarkdownMention, DataMarkdownNewline, DataMarkdownStrikethrough, DataMarkdownSubtitle, DataMarkdownText, DataMarkdownTitle };