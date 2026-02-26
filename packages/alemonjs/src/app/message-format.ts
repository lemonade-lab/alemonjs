import {
  DataMention,
  DataImage,
  DataText,
  DataImageURL,
  DataImageFile,
  ButtonRow,
  DataButtonGroup,
  DataButton,
  DataArkList,
  DataArkListTip,
  DataArkListContent,
  DataArkListItem,
  DataArkCard,
  DataArkBigCard,
  DataMarkdownTemplate,
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
  DataButtonTemplate,
  DataMarkdownCode,
  DataEnums,
  EventKeys,
  Events
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
 * @param val
 * @returns
 */
const Image = (val: Buffer): DataImage => {
  return {
    type: 'Image',
    value: val.toString('base64')
  };
};

Image.url = ImageURL;
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

const BT = (title: string, data: DataButton['options']['data'], options?: Omit<DataButton['options'], 'data'>): DataButton => {
  return {
    type: 'Button',
    value: title,
    options: {
      data,
      ...options
    }
  };
};

BT.group = function Group(...rows: ButtonRow[]): DataButtonGroup {
  return {
    type: 'BT.group',
    value: rows
  };
};

/**
 * 创建一个按钮模板
 * @param templateId  模板 ID
 * @returns
 */
BT.template = function Template(templateId: DataButtonTemplate['value']): DataButtonTemplate {
  return {
    type: 'ButtonTemplate',
    value: templateId
  };
};

BT.row = function Row(...buttons: DataButton[]): ButtonRow {
  return {
    type: 'BT.row',
    value: buttons
  };
};

export { BT };

// Ark 函数
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
const MD = (...values: DataMarkDown['value']): DataMarkDown => {
  return {
    type: 'Markdown',
    value: values
  };
};

/**
 *
 * @param templateId 模板 ID
 * @param params 模板参数
 * @returns
 */
MD.template = (templateId: DataMarkdownTemplate['value'], params?: DataMarkdownTemplate['options']['params']): DataMarkdownTemplate => {
  return {
    type: 'MarkdownTemplate',
    value: templateId,
    options: {
      params
    }
  };
};

/**
 *
 * @param text 要显示的文本
 * @returns
 */
MD.text = (text: string): DataMarkdownText => {
  return {
    type: 'MD.text',
    value: text
  };
};

/**
 *
 * @param text 要显示的文本
 * @returns
 */
MD.title = (text: string): DataMarkdownTitle => {
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
MD.subtitle = (text: string): DataMarkdownSubtitle => {
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
MD.bold = (text: string): DataMarkdownBold => {
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
MD.italic = (text: string): DataMarkdownItalic => {
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
MD.italicStar = (text: string): DataMarkdownItalicStar => {
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
MD.strikethrough = (text: string): DataMarkdownStrikethrough => {
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
MD.link = (text: string, url: string): DataMarkdownLink => {
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
MD.image = (url: string, options?: { width?: number; height?: number }): DataMarkdownImage => {
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
MD.list = (...items: any[]): DataMarkdownList => {
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
MD.listItem = (indexOrText: number | string, text?: string): DataMarkdownListItem => {
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
MD.blockquote = (text: string): DataMarkdownBlockquote => {
  return {
    type: 'MD.blockquote',
    value: text
  };
};

/**
 *
 * @returns
 */
MD.divider = (): DataMarkdownDivider => {
  return {
    type: 'MD.divider'
  };
};

/**
 * @param value 是否换多行
 * @returns
 */
MD.newline = (value = false): DataMarkdownNewline => {
  return {
    type: 'MD.newline',
    value: value
  };
};

MD.code = (value: DataMarkdownCode['value'], options?: DataMarkdownCode['options']): DataMarkdownCode => {
  return {
    type: 'MD.code',
    value: value,
    options: options
  };
};

export { MD };

/**
 * 消息格式化构建器
 *
 * @example
 * ```ts
 * const format = Format.create()
 * format.addText('hello').addBreak().addText('world')
 * message.send({ format })
 * ```
 */
export class Format {
  #data: DataEnums[] = [];

  /**
   * 创建一个新的 Format 实例
   */
  static create() {
    return new Format();
  }

  /**
   * 获取内部格式化数据
   */
  get value(): DataEnums[] {
    return this.#data;
  }

  /**
   * 添加文本
   */
  addText(...args: Parameters<typeof Text>) {
    this.#data.push(Text(...args));

    return this;
  }

  /**
   * 换行
   * @returns
   */
  addTextBreak() {
    this.#data.push(Text('\n'));

    return this;
  }

  /**
   * 添加链接
   */
  addLink(...args: Parameters<typeof Link>) {
    this.#data.push(Link(...args));

    return this;
  }

  /**
   * 添加图片 (Buffer)
   */
  addImage(...args: Parameters<typeof Image>) {
    this.#data.push(Image(...args));

    return this;
  }

  /**
   * 添加图片文件
   */
  addImageFile(...args: Parameters<typeof ImageFile>) {
    this.#data.push(ImageFile(...args));

    return this;
  }

  /**
   * 添加图片链接
   */
  addImageURL(...args: Parameters<typeof ImageURL>) {
    this.#data.push(ImageURL(...args));

    return this;
  }

  /**
   * 添加提及
   */
  addMention(...args: Parameters<typeof Mention>) {
    this.#data.push(Mention(...args));

    return this;
  }

  /**
   * 添加按钮组
   */
  addButtonGroup(...args: Parameters<typeof BT.group>) {
    this.#data.push(BT.group(...args));

    return this;
  }

  /**
   * 添加按钮模板
   */
  addButtonTemplate(...args: Parameters<typeof BT.template>) {
    this.#data.push(BT.template(...args));

    return this;
  }

  /**
   * 添加 Markdown
   */
  addMarkdown(...args: Parameters<typeof MD>) {
    this.#data.push(MD(...args));

    return this;
  }

  /**
   * 添加 Markdown 模板
   */
  addMarkdownTemplate(...args: Parameters<typeof MD.template>) {
    this.#data.push(MD.template(...args));

    return this;
  }

  /**
   * 清空
   */
  clear() {
    this.#data = [];

    return this;
  }
}

/**
 * 创建event
 * @param options
 * @returns
 */
export function createEvent<T extends EventKeys>(options: {
  event: any;
  selects: T | T[];
  regular?: RegExp;
  prefix?: string;
  exact?: string;
}): Events[T] & {
  selects: boolean;
  regular: boolean;
  prefix: boolean;
  exact: boolean;
} {
  const { event, selects, regular, prefix, exact } = options;
  const { name, MessageText } = event || {};
  const selectsArr = Array.isArray(selects) ? selects : [selects];

  const o = {
    selects: false,
    regular: false,
    prefix: false,
    exact: false
  };

  // 匹配选择事件类型
  if (selectsArr.includes(name)) {
    o.selects = true;
  }

  // 精准匹配
  if (exact && MessageText && MessageText === exact) {
    o.exact = true;
  }
  // 前缀匹配
  if (prefix && MessageText?.startsWith(prefix)) {
    o.prefix = true;
  }
  // 正则匹配
  if (regular && MessageText && new RegExp(regular).test(MessageText)) {
    o.regular = true;
  }

  return { ...event, ...o };
}
