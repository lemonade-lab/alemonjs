/**
 * @description 消息格式化工具（旧版）
 * @deprecated 废弃，推荐使用 Format 类进行消息构建。该文件不再新增任何新格式支持
 */
import {
  DataMention,
  DataImage,
  DataText,
  DataImageURL,
  DataImageFile,
  DataButtonRow,
  DataButtonGroup,
  DataButton,
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
import { Format, FormatMarkDown, FormatButtonGroup } from './message-format.js';

/**
 * 文本消息
 * @deprecated 废弃，推荐使用 Format.create().addText(...)
 */
export const Text = (val: DataText['value'], options?: DataText['options']): DataText => {
  return Format.create().addText(val, options).value[0] as DataText;
};

/**
 * 链接消息
 * @deprecated 废弃，这个应该是md语法里的
 */
export const Link = (val: DataLink['value'], options?: DataText['options']): DataText => {
  return Format.create().addLink(val, options).value[0] as DataText;
};

/**
 * 图片链接，http 或 https 开头
 * @deprecated 废弃，推荐使用 Format.create().addImage(...)
 */
export const ImageURL = (val: DataImageURL['value']): DataImageURL => {
  return Format.create().addImageURL(val).value[0] as DataImageURL;
};

/**
 * 本地图片文件
 * @deprecated 废弃，推荐使用 Format.create().addImage(...)
 */
export const ImageFile = (val: DataImageFile['value']): DataImageFile => {
  return Format.create().addImageFile(val).value[0] as DataImageFile;
};

/**
 * 图片消息
 * @param val Buffer 或带协议的字符串（https:// | http:// | file:// | base64://）
 * @deprecated 废弃，推荐使用 Format.create().addImage(...)
 */
const Image = (val: Buffer | string): DataImage => {
  return Format.create().addImage(val).value[0] as DataImage;
};

/**
 * @deprecated 废弃，推荐使用 Format.create().addImage(...)
 */
Image.url = ImageURL;
/**
 * @deprecated 废弃，推荐使用 Format.create().addImage(...)
 */
Image.file = ImageFile;
export { Image };

/**
 * 提及
 * @deprecated 废弃，推荐使用 Format.create().addMention(...)
 */
export const Mention = (UserId?: DataMention['value'], options?: DataMention['options']): DataMention => {
  return Format.create().addMention(UserId, options).value[0] as DataMention;
};

/**
 * @deprecated 废弃，推荐使用 Format.createButtonGroup().addButton(...)
 */
export const Button = (title: string, data: DataButton['options']['data'], options?: Omit<DataButton['options'], 'data'>): DataButton => {
  const group = Format.createButtonGroup().addButton(title, data, options).value;

  return group.value[0].value[0];
};

/**
 * @deprecated 废弃，推荐使用 Format.createButtonGroup()
 */
const ButtonGroup = (...rows: DataButtonRow[]): DataButtonGroup => {
  return Format.create().addButtonGroup(...rows).value[0] as DataButtonGroup;
};

/**
 * @deprecated 废弃，推荐使用 Format.createButtonGroup().addRow().addButton(...)
 */
const ButtonRow = (...buttons: DataButton[]): DataButtonRow => {
  return {
    type: 'BT.row',
    value: buttons
  };
};

Button.group = ButtonGroup;
Button.row = ButtonRow;

/**
 * @deprecated 废弃，推荐使用 Format.createButtonGroup()
 */
export const BT = Button;

/**
 * Markdown 容器
 * @deprecated 废弃，推荐使用 Format.createMarkdown()
 */
const Markdown = (...values: DataMarkDown['value']): DataMarkDown => {
  return Format.create().addMarkdown(...values).value[0] as DataMarkDown;
};

/**
 * @deprecated 废弃，推荐使用 Format.createMarkdown().addText(...)
 */
Markdown.text = (text: string): DataMarkdownText => {
  return Format.createMarkdown().addText(text).value.value[0] as DataMarkdownText;
};

/**
 * @deprecated 废弃，推荐使用 Format.createMarkdown().addMention(...)
 */
Markdown.mention = (uid?: string, options?: DataMarkdownMention['options']): DataMarkdownMention => {
  return Format.createMarkdown().addMention(uid, options).value.value[0] as DataMarkdownMention;
};

/**
 * @deprecated 废弃，推荐使用 Format.createMarkdown().addButton(...)
 */
Markdown.button = (title: string, data: DataMarkdownButton['options']): DataMarkdownButton => {
  return Format.createMarkdown().addButton(title, data).value.value[0] as DataMarkdownButton;
};

/**
 * @deprecated 废弃，推荐使用 Format.createMarkdown().addContent(...)
 */
Markdown.content = (text: string): DataMarkdownContent => {
  return Format.createMarkdown().addContent(text).value.value[0] as DataMarkdownContent;
};

/**
 * @deprecated 废弃，推荐使用 Format.createMarkdown().addTitle(...)
 */
Markdown.title = (text: string): DataMarkdownTitle => {
  return Format.createMarkdown().addTitle(text).value.value[0] as DataMarkdownTitle;
};

/**
 * @deprecated 废弃，推荐使用 Format.createMarkdown().addSubtitle(...)
 */
Markdown.subtitle = (text: string): DataMarkdownSubtitle => {
  return Format.createMarkdown().addSubtitle(text).value.value[0] as DataMarkdownSubtitle;
};

/**
 * @deprecated 废弃，推荐使用 Format.createMarkdown().addBold(...)
 */
Markdown.bold = (text: string): DataMarkdownBold => {
  return Format.createMarkdown().addBold(text).value.value[0] as DataMarkdownBold;
};

/**
 * @deprecated 废弃，推荐使用 Format.createMarkdown().addItalic(...)
 */
Markdown.italic = (text: string): DataMarkdownItalic => {
  return Format.createMarkdown().addItalic(text).value.value[0] as DataMarkdownItalic;
};

/**
 * @deprecated 废弃，推荐使用 Format.createMarkdown().addItalicStar(...)
 */
Markdown.italicStar = (text: string): DataMarkdownItalicStar => {
  return Format.createMarkdown().addItalicStar(text).value.value[0] as DataMarkdownItalicStar;
};

/**
 * @deprecated 废弃，推荐使用 Format.createMarkdown().addStrikethrough(...)
 */
Markdown.strikethrough = (text: string): DataMarkdownStrikethrough => {
  return Format.createMarkdown().addStrikethrough(text).value.value[0] as DataMarkdownStrikethrough;
};

/**
 * @deprecated 废弃，推荐使用 Format.createMarkdown().addLink(...)
 */
Markdown.link = (text: string, url?: string): DataMarkdownLink => {
  return Format.createMarkdown().addLink(text, url).value.value[0] as DataMarkdownLink;
};

/**
 * @deprecated 废弃，推荐使用 Format.createMarkdown().addImage(...)
 */
Markdown.image = (url: string, options?: { width?: number; height?: number }): DataMarkdownImage => {
  return Format.createMarkdown().addImage(url, options).value.value[0] as DataMarkdownImage;
};

/**
 * @deprecated 废弃，推荐使用 Format.createMarkdown().addList(...)
 */
Markdown.list = (...items: any[]): DataMarkdownList => {
  return Format.createMarkdown().addList(...items).value.value[0] as DataMarkdownList;
};

/**
 * @deprecated 废弃
 */
Markdown.listItem = (indexOrText: number | string, text?: string): DataMarkdownListItem => {
  return {
    type: 'MD.listItem',
    value: typeof indexOrText === 'number' ? { index: indexOrText, text } : indexOrText
  };
};

/**
 * @deprecated 废弃，推荐使用 Format.createMarkdown().addBlockquote(...)
 */
Markdown.blockquote = (text: string): DataMarkdownBlockquote => {
  return Format.createMarkdown().addBlockquote(text).value.value[0] as DataMarkdownBlockquote;
};

/**
 * @deprecated 废弃，推荐使用 Format.createMarkdown().addDivider()
 */
Markdown.divider = (): DataMarkdownDivider => {
  return Format.createMarkdown().addDivider().value.value[0] as DataMarkdownDivider;
};

/**
 * @deprecated 废弃，推荐使用 Format.createMarkdown().addNewline(...)
 */
Markdown.newline = (value = false): DataMarkdownNewline => {
  return Format.createMarkdown().addNewline(value).value.value[0] as DataMarkdownNewline;
};

/**
 * @deprecated 废弃，推荐使用 Format.createMarkdown().addCode(...)
 */
Markdown.code = (value: DataMarkdownCode['value'], options?: DataMarkdownCode['options']): DataMarkdownCode => {
  return Format.createMarkdown().addCode(value, options).value.value[0] as DataMarkdownCode;
};

/**
 * @deprecated 废弃，推荐使用 Format.createMarkdown()
 */
export const MD = Markdown;
export { Markdown };

/**
 * 纯 Markdown 文本
 * @deprecated 废弃，推荐使用 Format.create().addMarkdownOriginal(...)
 */
export const MarkdownOriginal = (val: string): DataMarkdownOriginal => {
  return Format.create().addMarkdownOriginal(val).value[0] as DataMarkdownOriginal;
};

/**
 * 附件消息
 * @deprecated 废弃，推荐使用 Format.create().addAttachment(...)
 */
export const Attachment = (val: string, options?: DataAttachment['options']): DataAttachment => {
  return Format.create().addAttachment(val, options).value[0] as DataAttachment;
};

/**
 * 音频消息
 * @deprecated 废弃，推荐使用 Format.create().addAudio(...)
 */
export const Audio = (val: string): DataAudio => {
  return Format.create().addAudio(val).value[0] as DataAudio;
};

/**
 * 视频消息
 * @deprecated 废弃，推荐使用 Format.create().addVideo(...)
 */
export const Video = (val: string): DataVideo => {
  return Format.create().addVideo(val).value[0] as DataVideo;
};

export { Format, FormatMarkDown, FormatButtonGroup };
