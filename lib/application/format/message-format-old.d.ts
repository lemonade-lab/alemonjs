import { DataButton, DataButtonGroup, DataButtonRow } from "../../types/message/button.js";
import { DataMarkDown, DataMarkdownBlockquote, DataMarkdownBold, DataMarkdownButton, DataMarkdownCode, DataMarkdownContent, DataMarkdownDivider, DataMarkdownImage, DataMarkdownItalic, DataMarkdownItalicStar, DataMarkdownLink, DataMarkdownList, DataMarkdownListItem, DataMarkdownMention, DataMarkdownNewline, DataMarkdownStrikethrough, DataMarkdownSubtitle, DataMarkdownText, DataMarkdownTitle } from "../../types/message/markdown.js";
import { DataImage, DataImageFile, DataImageURL } from "../../types/message/image.js";
import { DataText } from "../../types/message/text.js";
import { DataMention } from "../../types/message/mention.js";
import { DataLink } from "../../types/message/link.js";
import { DataAttachment } from "../../types/message/attachment.js";
import { DataAudio } from "../../types/message/audio.js";
import { DataVideo } from "../../types/message/video.js";
import { DataMarkdownOriginal } from "../../types/message/markdown-raw.js";
import "../../types/index.js";
import { Format, FormatButtonGroup, FormatMarkDown } from "./message-format.js";
//#region src/application/format/message-format-old.d.ts
/**
 * 文本消息
 * @deprecated 废弃，推荐使用 Format.create().addText(...)
 */
declare const Text: (val: DataText['value'], options?: DataText['options']) => DataText;
/**
 * 链接消息
 * @deprecated 废弃，这个应该是md语法里的
 */
declare const Link: (val: DataLink['value'], options?: DataText['options']) => DataText;
/**
 * 图片链接，http 或 https 开头
 * @deprecated 废弃，推荐使用 Format.create().addImage(...)
 */
declare const ImageURL: (val: DataImageURL['value']) => DataImageURL;
/**
 * 本地图片文件
 * @deprecated 废弃，推荐使用 Format.create().addImage(...)
 */
declare const ImageFile: (val: DataImageFile['value']) => DataImageFile;
declare function Image(val: Buffer | string): DataImage;
declare namespace Image {
  export { ImageURL as url };
  export { ImageFile as file };
}
/**
 * 提及
 * @deprecated 废弃，推荐使用 Format.create().addMention(...)
 */
declare const Mention: (UserId?: DataMention['value'], options?: DataMention['options']) => DataMention;
declare function Button(title: string, data: DataButton['options']['data'], options?: Omit<DataButton['options'], 'data'>): DataButton;
declare namespace Button {
  export { ButtonGroup as group };
  export { ButtonRow as row };
}
/**
 * @deprecated 废弃，推荐使用 Format.createButtonGroup()
 */
declare const ButtonGroup: (...rows: DataButtonRow[]) => DataButtonGroup;
/**
 * @deprecated 废弃，推荐使用 Format.createButtonGroup().addRow().addButton(...)
 */
declare const ButtonRow: (...buttons: DataButton[]) => DataButtonRow;
/**
 * @deprecated 废弃，推荐使用 Format.createButtonGroup()
 */
declare const BT: typeof Button;
declare function Markdown(...values: DataMarkDown['value']): DataMarkDown;
declare namespace Markdown {
  var text: (text: string) => DataMarkdownText;
  var mention: (uid?: string, options?: DataMarkdownMention['options']) => DataMarkdownMention;
  var button: (title: string, data: DataMarkdownButton['options']) => DataMarkdownButton;
  var content: (text: string) => DataMarkdownContent;
  var title: (text: string) => DataMarkdownTitle;
  var subtitle: (text: string) => DataMarkdownSubtitle;
  var bold: (text: string) => DataMarkdownBold;
  var italic: (text: string) => DataMarkdownItalic;
  var italicStar: (text: string) => DataMarkdownItalicStar;
  var strikethrough: (text: string) => DataMarkdownStrikethrough;
  var link: (text: string, url?: string) => DataMarkdownLink;
  var image: (url: string, options?: {
    width?: number;
    height?: number;
  }) => DataMarkdownImage;
  var list: (...items: any[]) => DataMarkdownList;
  var listItem: (indexOrText: number | string, text?: string) => DataMarkdownListItem;
  var blockquote: (content: string | FormatMarkDown | DataMarkDown['value']) => DataMarkdownBlockquote;
  var divider: () => DataMarkdownDivider;
  var newline: (value?: boolean) => DataMarkdownNewline;
  var code: (value: DataMarkdownCode['value'], options?: DataMarkdownCode['options']) => DataMarkdownCode;
}
/**
 * @deprecated 废弃，推荐使用 Format.createMarkdown()
 */
declare const MD: typeof Markdown;
/**
 * 纯 Markdown 文本
 * @deprecated 废弃，推荐使用 Format.create().addMarkdownOriginal(...)
 */
declare const MarkdownOriginal: (val: string) => DataMarkdownOriginal;
/**
 * 附件消息
 * @deprecated 废弃，推荐使用 Format.create().addAttachment(...)
 */
declare const Attachment: (val: string, options?: DataAttachment['options']) => DataAttachment;
/**
 * 音频消息
 * @deprecated 废弃，推荐使用 Format.create().addAudio(...)
 */
declare const Audio: (val: string) => DataAudio;
/**
 * 视频消息
 * @deprecated 废弃，推荐使用 Format.create().addVideo(...)
 */
declare const Video: (val: string) => DataVideo;
//#endregion
export { Attachment, Audio, BT, Button, Format, FormatButtonGroup, FormatMarkDown, Image, ImageFile, ImageURL, Link, MD, Markdown, MarkdownOriginal, Mention, Text, Video };