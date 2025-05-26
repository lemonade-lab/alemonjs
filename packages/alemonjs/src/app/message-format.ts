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
  DataMarkdownText
} from '../typings'

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
  }
}

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
  }
}

/**
 * 图片链接，http 或 https 开头
 * @param val
 * @returns
 */
export const ImageURL = (val: DataImageURL['value']): DataImageURL => {
  return {
    type: 'ImageURL',
    value: val
  }
}

/**
 * 本地图片文件
 * @param val
 * @returns
 */
export const ImageFile = (val: DataImageFile['value']): DataImageFile => {
  return {
    type: 'ImageFile',
    value: val
  }
}

/**
 * 图片消息
 * @param val
 * @returns
 */
const Image = (val: Buffer): DataImage => {
  return {
    type: 'Image',
    value: val.toString('base64')
  }
}
Image.url = ImageURL
Image.file = ImageFile
export { Image }

/**
 * 提及
 * @param UserId 默认 @ 所有人
 * @param options 默认 user
 * @returns
 */
export const Mention = (
  UserId?: DataMention['value'],
  options?: DataMention['options']
): DataMention => {
  return {
    type: 'Mention',
    value: UserId,
    options: options ?? {
      belong: 'user'
    }
  }
}

const BT = (
  title: string,
  data: DataButton['options']['data'],
  options?: Omit<DataButton['options'], 'data'>
): DataButton => {
  return {
    type: 'Button',
    value: title,
    options: {
      data,
      ...options
    }
  }
}

BT.group = function Group(...rows: ButtonRow[]): DataButtonGroup {
  return {
    type: 'BT.group',
    value: rows
  }
}

BT.template = function Template(value: DataButtonGroup['options']['template_id']): DataButtonGroup {
  return {
    type: 'BT.group',
    value: [],
    options: {
      template_id: value
    }
  }
}

BT.row = function Row(...buttons: DataButton[]): ButtonRow {
  return {
    type: 'BT.row',
    value: buttons
  }
}

export { BT }

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
    }
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
    }
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
    }
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
    }
  },
  /**
   * @param value 卡片内容
   * @returns
   */
  Card: (value: DataArkCard['value']): DataArkCard => {
    return {
      type: 'Ark.Card',
      value: value
    }
  },
  /**
   * @param value 大卡片内容
   * @returns
   */
  BigCard: (value: DataArkBigCard['value']): DataArkBigCard => {
    return {
      type: 'Ark.BigCard',
      value
    }
  }
}

/**
 *
 * @param values 要显示的文本
 * @returns
 */
const MD = (...values: DataMarkDown['value']): DataMarkDown => {
  return {
    type: 'Markdown',
    value: values
  }
}

/**
 *
 * @param templateId 模板 ID
 * @param params 模板参数
 * @returns
 */
MD.template = (
  templateId: DataMarkdownTemplate['value'],
  params?: DataMarkdownTemplate['options']['params']
) => {
  return {
    type: 'MD.template',
    value: templateId,
    options: {
      params
    }
  }
}

/**
 *
 * @param text 要显示的文本
 * @returns
 */
MD.text = (text: string): DataMarkdownText => {
  return {
    type: 'MD.text',
    value: text
  }
}

/**
 *
 * @param text 要显示的文本
 * @returns
 */
MD.title = (text: string): DataMarkdownTitle => {
  return {
    type: 'MD.title',
    value: text
  }
}

/**
 *
 * @param text 要显示的文本
 * @returns
 */
MD.subtitle = (text: string): DataMarkdownSubtitle => {
  return {
    type: 'MD.subtitle',
    value: text
  }
}

/**
 *
 * @param text 要显示的文本
 * @returns
 */
MD.bold = (text: string): DataMarkdownBold => {
  return {
    type: 'MD.bold',
    value: text
  }
}

/**
 *
 * @param text 要显示的文本
 * @returns
 */
MD.italic = (text: string): DataMarkdownItalic => {
  return {
    type: 'MD.italic',
    value: text
  }
}

/**
 *
 * @param text 要显示的文本
 * @returns
 */
MD.italicStar = (text: string): DataMarkdownItalicStar => {
  return {
    type: 'MD.italicStar',
    value: text
  }
}

/**
 *
 * @param text 要显示的文本
 * @returns
 */
MD.strikethrough = (text: string): DataMarkdownStrikethrough => {
  return {
    type: 'MD.strikethrough',
    value: text
  }
}

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
  }
}

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
  }
}

/**
 *
 * @param items
 * @returns
 */
MD.list = (...items: any[]): DataMarkdownList => {
  return {
    type: 'MD.list',
    value: items
  }
}

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
  }
}

/**
 *
 * @param text 块引用的文本内容
 * @returns
 */
MD.blockquote = (text: string): DataMarkdownBlockquote => {
  return {
    type: 'MD.blockquote',
    value: text
  }
}

/**
 *
 * @returns
 */
MD.divider = (): DataMarkdownDivider => {
  return {
    type: 'MD.divider'
  }
}

/**
 * @param value 是否换多行
 * @returns
 */
MD.newline = (value: boolean = false): DataMarkdownNewline => {
  return {
    type: 'MD.newline',
    value: value
  }
}

export { MD }
