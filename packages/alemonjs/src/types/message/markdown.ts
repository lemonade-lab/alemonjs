/**
 *
 */
export type DataMarkdownTemplate = {
  type: 'MarkdownTemplate';
  value: string; // template_id
  options: {
    params: {
      [key: string]: string;
    };
  };
};

// type Markdown

export type DataMarkdownText = {
  type: 'MD.text';
  value: string;
};

export type DataMarkdownMention = {
  type: 'MD.mention';
  value?: string;
  options?: {
    belong?: 'user' | 'channel' | 'all'; // 默认为 user，表示只@用户；channel 表示@频道内所有人；all 表示@所有人
  };
};

export type DataMarkdownContent = {
  type: 'MD.content';
  value: string;
};

export type DataMarkdownButton = {
  type: 'MD.button';
  // 显示的文字
  value: string;
  options?: {
    // 禁止提示
    toolTip?: string;
    // 自动回车
    autoEnter?: boolean;
    // 数据
    data?: string;
    // isLink?: boolean
    type?: 'command' | 'link' | 'call';
  };
};

export type DataMarkdownTitle = {
  type: 'MD.title';
  value: string;
};

export type DataMarkdownSubtitle = {
  type: 'MD.subtitle';
  value: string;
};

export type DataMarkdownBold = {
  type: 'MD.bold';
  value: string;
};

export type DataMarkdownItalic = {
  type: 'MD.italic';
  value: string;
};

export type DataMarkdownItalicStar = {
  type: 'MD.italicStar';
  value: string;
};

export type DataMarkdownStrikethrough = {
  type: 'MD.strikethrough';
  value: string;
};

export type DataMarkdownLink = {
  type: 'MD.link';
  value: {
    text: string;
    url: string;
  };
};
export type DataMarkdownImage = {
  type: 'MD.image';
  value: string;
  options?: {
    width?: number;
    height?: number;
  };
};

export type DataMarkdownListItem = {
  type: 'MD.listItem';
  value: string | { index: number; text?: string };
};

export type DataMarkdownList = {
  type: 'MD.list';
  value: DataMarkdownListItem[];
};

export type DataMarkdownBlockquote = {
  type: 'MD.blockquote';
  value: string;
};

export type DataMarkdownDivider = {
  type: 'MD.divider';
};

export type DataMarkdownNewline = {
  type: 'MD.newline';
  value: boolean;
};

export type DataMarkdownCode = {
  type: 'MD.code';
  value: string;
  options?: {
    language?: string; // 代码语言
  };
};

export type DataCustom = {
  type: string;
  value: string;
  options?: {
    [key: string]: any;
  };
};

type DataMarkDownBalue =
  | DataMarkdownMention // at
  | DataMarkdownContent // originalContent
  | DataMarkdownButton // 按钮
  | DataMarkdownText
  | DataMarkdownTitle
  | DataMarkdownSubtitle
  | DataMarkdownBold
  | DataMarkdownItalic
  | DataMarkdownItalicStar
  | DataMarkdownStrikethrough
  | DataMarkdownLink
  | DataMarkdownImage
  | DataMarkdownList
  | DataMarkdownBlockquote
  | DataMarkdownDivider
  | DataMarkdownNewline
  | DataMarkdownCode
  | DataCustom;

export type DataMarkDown = {
  type: 'Markdown';
  value: DataMarkDownBalue[];
};
