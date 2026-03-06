import {
  DataMention,
  DataImage,
  DataText,
  DataImageURL,
  DataImageFile,
  DataButtonRow,
  DataButtonGroup,
  DataButton,
  DataArkList,
  DataArkListTip,
  DataArkListContent,
  DataArkListItem,
  DataArkCard,
  DataArkBigCard,
  DataMarkDown,
  DataMarkdownTitle,
  DataMarkdownSubtitle,
  DataMarkdownBold,
  DataMarkdownItalic,
  DataMarkdownItalicStar,
  DataMarkdownStrikethrough,
  DataMarkdownLink,
  DataMarkdownImage,
  DataMarkdownList,
  DataMarkdownListItem,
  DataMarkdownBlockquote,
  DataMarkdownDivider,
  DataMarkdownNewline,
  DataLink,
  DataMarkdownText,
  DataMarkdownCode,
  DataMarkdownOriginal,
  DataAttachment,
  DataAudio,
  DataVideo,
  DataMarkdownMention,
  DataMarkdownContent,
  DataMarkdownButton
} from '../types';

/**
 * 文本消息
 * @param val
 * @param options
 * @returns
 */
export const Text = (val: DataText['value'], options?: DataText['options']): DataText => {
  return {
    type: 'Text',
    value: val,
    options
  };
};

/**
 * 链接消息
 * @deprecated 废弃，这个应该是md语法里的
 * @param val 要显示的文本
 * @param options 内容选项
 * @returns
 */
export const Link = (val: DataLink['value'], options?: DataText['options']): DataText => {
  return {
    type: 'Text',
    value: val,
    options
  };
};

/**
 * 图片链接，http 或 https 开头
 * @deprecated 废弃，推荐使用 Image
 * @param val
 * @returns
 */
export const ImageURL = (val: DataImageURL['value']): DataImageURL => {
  return {
    type: 'ImageURL',
    value: val
  };
};

/**
 * 本地图片文件
 * @deprecated 废弃，推荐使用 Image
 * @param val
 * @returns
 */
export const ImageFile = (val: DataImageFile['value']): DataImageFile => {
  return {
    type: 'ImageFile',
    value: val
  };
};

/**
 * 图片消息
 * @param val Buffer 或带协议的字符串（https:// | http:// | file:// | base64://）
 * @returns
 */
const Image = (val: Buffer | string): DataImage => {
  return {
    type: 'Image',
    // 自动转为 base64 格式字符串，或者直接使用带协议的字符串
    value: typeof val === 'string' ? val : `base64://${val.toString('base64')}`
  };
};

/**
 * @deprecated 废弃，推荐使用 Image
 */
Image.url = ImageURL;
/**
 * @deprecated 废弃，推荐使用 Image
 */
Image.file = ImageFile;
export { Image };

/**
 * 提及
 * @param UserId 默认 @ 所有人
 * @param options 默认 user
 * @returns
 */
export const Mention = (UserId?: DataMention['value'], options?: DataMention['options']): DataMention => {
  return {
    type: 'Mention',
    value: UserId,
    options: options ?? {
      belong: 'user'
    }
  };
};

export const Button = (title: string, data: DataButton['options']['data'], options?: Omit<DataButton['options'], 'data'>): DataButton => {
  return {
    type: 'Button',
    value: title,
    options: {
      data, // command 数据，必填
      ...options
    }
  };
};

const ButtonGroup = (...rows: DataButtonRow[]): DataButtonGroup => {
  return {
    type: 'BT.group',
    value: rows
  };
};

const ButtonRow = (...buttons: DataButton[]): DataButtonRow => {
  return {
    type: 'BT.row',
    value: buttons
  };
};

Button.group = ButtonGroup;

Button.row = ButtonRow;

export const BT = Button;

/**
 * @deprecated 废弃，推荐使用 MD
 */
export const Ark = {
  /**
   *
   * @param values 要显示的文本
   * @returns
   */
  list: (...values: DataArkList['value']): DataArkList => {
    return {
      type: 'Ark.list',
      value: values
    };
  },
  /**
   *
   * @param options 提示信息
   * @returns
   */
  listTip: (options: DataArkListTip['value']): DataArkListTip => {
    return {
      type: 'Ark.listTip',
      value: options
    };
  },
  /**
   *
   * @param values 实际内容
   * @returns
   */
  listContent: (...values: DataArkListContent['value']): DataArkListContent => {
    return {
      type: 'Ark.listContent',
      value: values
    };
  },
  /**
   *
   * @param value 列表项内容
   * @returns
   */
  listItem: (value: DataArkListItem['value']): DataArkListItem => {
    return {
      type: 'Ark.listItem',
      value: value
    };
  },
  /**
   * @param value 卡片内容
   * @returns
   */
  Card: (value: DataArkCard['value']): DataArkCard => {
    return {
      type: 'Ark.Card',
      value: value
    };
  },
  /**
   * @param value 大卡片内容
   * @returns
   */
  BigCard: (value: DataArkBigCard['value']): DataArkBigCard => {
    return {
      type: 'Ark.BigCard',
      value
    };
  }
};

/**
 *
 * @param values 要显示的文本
 * @returns
 */
const Markdown = (...values: DataMarkDown['value']): DataMarkDown => {
  return {
    type: 'Markdown',
    value: values
  };
};

/**
 *
 * @param text 要显示的文本
 * @returns
 */
Markdown.text = (text: string): DataMarkdownText => {
  return {
    type: 'MD.text',
    value: text
  };
};

Markdown.mention = (uid?: string, options?: DataMarkdownMention['options']): DataMarkdownMention => {
  return {
    type: 'MD.mention',
    // 默认 @所有人，如果传入 uid 则 @ 指定用户
    value: uid || '',
    options: options ?? {
      belong: 'all'
    }
  };
};

Markdown.button = (title: string, data: DataMarkdownButton['options']): DataMarkdownButton => {
  return {
    type: 'MD.button',
    value: title,
    options: data
  };
};

/**
 * originalContent
 */
Markdown.content = (text: string): DataMarkdownContent => {
  return {
    type: 'MD.content',
    value: text
  };
};

/**
 *
 * @param text 要显示的文本
 * @returns
 */
Markdown.title = (text: string): DataMarkdownTitle => {
  return {
    type: 'MD.title',
    value: text
  };
};

/**
 *
 * @param text 要显示的文本
 * @returns
 */
Markdown.subtitle = (text: string): DataMarkdownSubtitle => {
  return {
    type: 'MD.subtitle',
    value: text
  };
};

/**
 *
 * @param text 要显示的文本
 * @returns
 */
Markdown.bold = (text: string): DataMarkdownBold => {
  return {
    type: 'MD.bold',
    value: text
  };
};

/**
 *
 * @param text 要显示的文本
 * @returns
 */
Markdown.italic = (text: string): DataMarkdownItalic => {
  return {
    type: 'MD.italic',
    value: text
  };
};

/**
 *
 * @param text 要显示的文本
 * @returns
 */
Markdown.italicStar = (text: string): DataMarkdownItalicStar => {
  return {
    type: 'MD.italicStar',
    value: text
  };
};

/**
 *
 * @param text 要显示的文本
 * @returns
 */
Markdown.strikethrough = (text: string): DataMarkdownStrikethrough => {
  return {
    type: 'MD.strikethrough',
    value: text
  };
};

/**
 *
 * @param text 要显示的文本
 * @param url  链接地址
 * @returns
 */
Markdown.link = (text: string, url: string): DataMarkdownLink => {
  return {
    type: 'MD.link',
    value: { text, url }
  };
};

/**
 *
 * @param url 图片地址
 * @param options 图片选项
 * @returns
 */
Markdown.image = (url: string, options?: { width?: number; height?: number }): DataMarkdownImage => {
  return {
    type: 'MD.image',
    value: url,
    options
  };
};

/**
 *
 * @param items
 * @returns
 */
Markdown.list = (...items: any[]): DataMarkdownList => {
  return {
    type: 'MD.list',
    value: items
  };
};

/**
 *
 * @param indexOrText
 * @param text
 * @returns
 */
Markdown.listItem = (indexOrText: number | string, text?: string): DataMarkdownListItem => {
  return {
    type: 'MD.listItem',
    value: typeof indexOrText === 'number' ? { index: indexOrText, text } : indexOrText
  };
};

/**
 *
 * @param text 块引用的文本内容
 * @returns
 */
Markdown.blockquote = (text: string): DataMarkdownBlockquote => {
  return {
    type: 'MD.blockquote',
    value: text
  };
};

/**
 *
 * @returns
 */
Markdown.divider = (): DataMarkdownDivider => {
  return {
    type: 'MD.divider'
  };
};

/**
 * @param value 是否换多行
 * @returns
 */
Markdown.newline = (value = false): DataMarkdownNewline => {
  return {
    type: 'MD.newline',
    value: value
  };
};

Markdown.code = (value: DataMarkdownCode['value'], options?: DataMarkdownCode['options']): DataMarkdownCode => {
  return {
    type: 'MD.code',
    value: value,
    options: options
  };
};

export const MD = Markdown;
export { Markdown };

/**
 * 纯 Markdown 文本
 * @param val 原始 Markdown 字符串
 * @returns
 */
export const MarkdownOriginal = (val: string): DataMarkdownOriginal => {
  return {
    type: 'MarkdownOriginal',
    value: val
  };
};

/**
 * 附件消息
 * @param val 带协议的字符串（https:// | http:// | file:// | base64://）
 * @param options 附件选项
 * @returns
 */
export const Attachment = (val: string, options?: DataAttachment['options']): DataAttachment => {
  return {
    type: 'Attachment',
    value: val,
    options
  };
};

/**
 * 音频消息
 * @param val 带协议的字符串（https:// | http:// | file:// | base64://）
 * @returns
 */
export const Audio = (val: string): DataAudio => {
  return {
    type: 'Audio',
    value: val
  };
};

/**
 * 视频消息
 * @param val 带协议的字符串（https:// | http:// | file:// | base64://）
 * @returns
 */
export const Video = (val: string): DataVideo => {
  return {
    type: 'Video',
    value: val
  };
};
