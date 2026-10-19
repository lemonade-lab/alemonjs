import { Format, FormatButtonGroup, FormatMarkDown } from "./message-format.js";

//#region src/application/format/message-format-old.ts
/**
* 文本消息
* @deprecated 废弃，推荐使用 Format.create().addText(...)
*/
const Text = (val, options) => {
	return Format.create().addText(val, options).value[0];
};
/**
* 链接消息
* @deprecated 废弃，这个应该是md语法里的
*/
const Link = (val, options) => {
	return Format.create().addLink(val, options).value[0];
};
/**
* 图片链接，http 或 https 开头
* @deprecated 废弃，推荐使用 Format.create().addImage(...)
*/
const ImageURL = (val) => {
	return Format.create().addImageURL(val).value[0];
};
/**
* 本地图片文件
* @deprecated 废弃，推荐使用 Format.create().addImage(...)
*/
const ImageFile = (val) => {
	return Format.create().addImageFile(val).value[0];
};
/**
* 图片消息
* @param val Buffer 或带协议的字符串（https:// | http:// | file:// | base64://）
* @deprecated 废弃，推荐使用 Format.create().addImage(...)
*/
const Image = (val) => {
	return Format.create().addImage(val).value[0];
};
/**
* @deprecated 废弃，推荐使用 Format.create().addImage(...)
*/
Image.url = ImageURL;
/**
* @deprecated 废弃，推荐使用 Format.create().addImage(...)
*/
Image.file = ImageFile;
/**
* 提及
* @deprecated 废弃，推荐使用 Format.create().addMention(...)
*/
const Mention = (UserId, options) => {
	return Format.create().addMention(UserId, options).value[0];
};
/**
* @deprecated 废弃，推荐使用 Format.createButtonGroup().addButton(...)
*/
const Button = (title, data, options) => {
	return Format.createButtonGroup().addButton(title, data, options).value.value[0].value[0];
};
/**
* @deprecated 废弃，推荐使用 Format.createButtonGroup()
*/
const ButtonGroup = (...rows) => {
	return Format.create().addButtonGroup(...rows).value[0];
};
/**
* @deprecated 废弃，推荐使用 Format.createButtonGroup().addRow().addButton(...)
*/
const ButtonRow = (...buttons) => {
	return {
		type: "BT.row",
		value: buttons
	};
};
Button.group = ButtonGroup;
Button.row = ButtonRow;
/**
* @deprecated 废弃，推荐使用 Format.createButtonGroup()
*/
const BT = Button;
/**
* Markdown 容器
* @deprecated 废弃，推荐使用 Format.createMarkdown()
*/
const Markdown = (...values) => {
	return Format.create().addMarkdown(...values).value[0];
};
/**
* @deprecated 废弃，推荐使用 Format.createMarkdown().addText(...)
*/
Markdown.text = (text) => {
	return Format.createMarkdown().addText(text).value.value[0];
};
/**
* @deprecated 废弃，推荐使用 Format.createMarkdown().addMention(...)
*/
Markdown.mention = (uid, options) => {
	return Format.createMarkdown().addMention(uid, options).value.value[0];
};
/**
* @deprecated 废弃，推荐使用 Format.createMarkdown().addButton(...)
*/
Markdown.button = (title, data) => {
	return Format.createMarkdown().addButton(title, data).value.value[0];
};
/**
* @deprecated 废弃，推荐使用 Format.createMarkdown().addContent(...)
*/
Markdown.content = (text) => {
	return Format.createMarkdown().addContent(text).value.value[0];
};
/**
* @deprecated 废弃，推荐使用 Format.createMarkdown().addTitle(...)
*/
Markdown.title = (text) => {
	return Format.createMarkdown().addTitle(text).value.value[0];
};
/**
* @deprecated 废弃，推荐使用 Format.createMarkdown().addSubtitle(...)
*/
Markdown.subtitle = (text) => {
	return Format.createMarkdown().addSubtitle(text).value.value[0];
};
/**
* @deprecated 废弃，推荐使用 Format.createMarkdown().addBold(...)
*/
Markdown.bold = (text) => {
	return Format.createMarkdown().addBold(text).value.value[0];
};
/**
* @deprecated 废弃，推荐使用 Format.createMarkdown().addItalic(...)
*/
Markdown.italic = (text) => {
	return Format.createMarkdown().addItalic(text).value.value[0];
};
/**
* @deprecated 废弃，推荐使用 Format.createMarkdown().addItalicStar(...)
*/
Markdown.italicStar = (text) => {
	return Format.createMarkdown().addItalicStar(text).value.value[0];
};
/**
* @deprecated 废弃，推荐使用 Format.createMarkdown().addStrikethrough(...)
*/
Markdown.strikethrough = (text) => {
	return Format.createMarkdown().addStrikethrough(text).value.value[0];
};
/**
* @deprecated 废弃，推荐使用 Format.createMarkdown().addLink(...)
*/
Markdown.link = (text, url) => {
	return Format.createMarkdown().addLink(text, url).value.value[0];
};
/**
* @deprecated 废弃，推荐使用 Format.createMarkdown().addImage(...)
*/
Markdown.image = (url, options) => {
	return Format.createMarkdown().addImage(url, options).value.value[0];
};
/**
* @deprecated 废弃，推荐使用 Format.createMarkdown().addList(...)
*/
Markdown.list = (...items) => {
	return Format.createMarkdown().addList(...items).value.value[0];
};
/**
* @deprecated 废弃
*/
Markdown.listItem = (indexOrText, text) => {
	return {
		type: "MD.listItem",
		value: typeof indexOrText === "number" ? {
			index: indexOrText,
			text
		} : indexOrText
	};
};
/**
* @deprecated 废弃，推荐使用 Format.createMarkdown().addBlockquote(...)
*/
Markdown.blockquote = (content) => {
	return Format.createMarkdown().addBlockquote(content).value.value[0];
};
/**
* @deprecated 废弃，推荐使用 Format.createMarkdown().addDivider()
*/
Markdown.divider = () => {
	return Format.createMarkdown().addDivider().value.value[0];
};
/**
* @deprecated 废弃，推荐使用 Format.createMarkdown().addNewline(...)
*/
Markdown.newline = (value = false) => {
	return Format.createMarkdown().addNewline(value).value.value[0];
};
/**
* @deprecated 废弃，推荐使用 Format.createMarkdown().addCode(...)
*/
Markdown.code = (value, options) => {
	return Format.createMarkdown().addCode(value, options).value.value[0];
};
/**
* @deprecated 废弃，推荐使用 Format.createMarkdown()
*/
const MD = Markdown;
/**
* 纯 Markdown 文本
* @deprecated 废弃，推荐使用 Format.create().addMarkdownOriginal(...)
*/
const MarkdownOriginal = (val) => {
	return Format.create().addMarkdownOriginal(val).value[0];
};
/**
* 附件消息
* @deprecated 废弃，推荐使用 Format.create().addAttachment(...)
*/
const Attachment = (val, options) => {
	return Format.create().addAttachment(val, options).value[0];
};
/**
* 音频消息
* @deprecated 废弃，推荐使用 Format.create().addAudio(...)
*/
const Audio = (val) => {
	return Format.create().addAudio(val).value[0];
};
/**
* 视频消息
* @deprecated 废弃，推荐使用 Format.create().addVideo(...)
*/
const Video = (val) => {
	return Format.create().addVideo(val).value[0];
};

//#endregion
export { Attachment, Audio, BT, Button, Format, FormatButtonGroup, FormatMarkDown, Image, ImageFile, ImageURL, Link, MD, Markdown, MarkdownOriginal, Mention, Text, Video };