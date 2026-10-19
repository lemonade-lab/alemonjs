import { DataButton, DataButtonGroup, DataButtonRow } from "../../types/message/button.js";
import { DataMarkDown, DataMarkdownButton, DataMarkdownCode, DataMarkdownListItem, DataMarkdownMention } from "../../types/message/markdown.js";
import { DataImageFile, DataImageURL } from "../../types/message/image.js";
import { DataText } from "../../types/message/text.js";
import { DataMention } from "../../types/message/mention.js";
import { DataLink } from "../../types/message/link.js";
import { DataAttachment } from "../../types/message/attachment.js";
import { DataSelect, DataSelectOption } from "../../types/message/select.js";
import { DataEmbed } from "../../types/message/embed.js";
import { DataEnums } from "../../types/message/index.js";
import "../../types/index.js";
//#region src/application/format/message-format.d.ts
declare class FormatButtonGroup {
  #private;
  /**
   * 获取按钮组数据
   */
  get value(): DataButtonGroup;
  /**
   * 小按钮样式：整个键盘使用小号按钮（QQ-Bot keyboard.content.style）
   */
  smallButton(): this;
  /**
   * 键盘级配置（QQ-Bot 专用）
   * @param options smallButton 小按钮 / rawData 键盘级原始字段透传
   */
  setOptions(options?: DataButtonGroup['options']): this;
  /**
   * 吸收另一个 FormatButtonGroup 的数据
   * @param group 要吸收的 FormatButtonGroup 实例
   * @returns 当前实例
   */
  absorb(group: FormatButtonGroup): this;
  /**
   * 新增一行按钮
   * @returns 当前实例
   */
  addRow(): this;
  /**
   * 添加一个按钮到当前行，若无行则自动创建
   */
  addButton(title: string, data: DataButton['options']['data'], options?: Omit<DataButton['options'], 'data'>): this;
  /**
   * 清空
   */
  clear(): this;
}
declare class FormatMarkDown {
  #private;
  /**
   * 获取 Markdown 数据
   */
  get value(): DataMarkDown;
  /**
   * 吸收另一个 FormatMarkDown 的数据
   * @param md 要吸收的 FormatMarkDown 实例
   * @returns 当前实例
   */
  absorb(md: FormatMarkDown): this;
  /**
   * 添加原始文本
   */
  addContent(text: string): this;
  /**
   * 添加文本
   */
  addText(text: string): this;
  /**
   * 添加标题
   */
  addTitle(text: string): this;
  /**
   * 添加副标题
   */
  addSubtitle(text: string): this;
  /**
   * 添加粗体
   */
  addBold(text: string): this;
  /**
   * 添加斜体
   */
  addItalic(text: string): this;
  /**
   * 添加斜体（星号）
   */
  addItalicStar(text: string): this;
  /**
   * 添加删除线
   */
  addStrikethrough(text: string): this;
  /**
   * 添加链接
   */
  addLink(text: string, url?: string): this;
  /**
   * 添加图片
   */
  addImage(url: string, options?: {
    width?: number;
    height?: number;
  }): this;
  /**
   * 添加列表
   */
  addList(...items: (DataMarkdownListItem | DataMarkdownListItem['value'])[]): this;
  /**
   * 添加完整引用块。支持旧字符串、Markdown 构建器或子节点数组。
   * 后续添加的节点位于引用外；字符串保持原有平台解释方式。
   */
  addBlockquote(content: string | FormatMarkDown | DataMarkDown['value']): this;
  /**
   * 添加分割线
   */
  addDivider(): this;
  /**
   * 添加换行
   */
  addNewline(value?: boolean): this;
  /**
   * 添加代码
   */
  addCode(value: DataMarkdownCode['value'], options?: DataMarkdownCode['options']): this;
  /**
   * 换行
   */
  addBreak(): this;
  addMention(uid?: string, options?: DataMarkdownMention['options']): this;
  addButton(title: string, data: DataMarkdownButton['options']): this;
  /**
   * 清空
   */
  clear(): this;
}
/**
 * Select 构建器（选项组）
 */
declare class FormatSelect {
  #private;
  get value(): DataSelect;
  setCustomId(customId: string): this;
  setPlaceholder(placeholder: string): this;
  setRange(min?: number, max?: number): this;
  setKind(kind: DataSelect['options']['kind']): this;
  setDisabled(disabled?: boolean): this;
  addOption(label: string, value: string, extra?: Omit<DataSelectOption, 'label' | 'value'>): this;
  clear(): this;
}
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
declare class Format {
  #private;
  /**
   * 创建一个新的 Format 实例
   */
  static create(): Format;
  /**
   * 创建一个新的 Markdown Format 实例
   */
  static createMarkdown(): FormatMarkDown;
  /**
   * 创建一个新的 Button Format 实例
   */
  static createButtonGroup(): FormatButtonGroup;
  /**
   * 创建一个新的 Select 实例
   */
  static createSelect(): FormatSelect;
  /**
   * 获取内部格式化数据
   */
  get value(): DataEnums[];
  absorb(format: Format): this;
  /**
   * 添加文本
   */
  addText(val: DataText['value'], options?: DataText['options']): this;
  /**
   * 添加图片 (Buffer 或带协议字符串)
   */
  addImage(val: Buffer | string): this;
  /**
   * 添加提及
   */
  addMention(UserId?: DataMention['value'], options?: DataMention['options']): this;
  /**
   * 添加按钮组
   */
  addButtonGroup(bt: FormatButtonGroup): this;
  addButtonGroup(...rows: DataButtonRow[]): this;
  /**
   * 添加结构化 Markdown
   */
  addMarkdown(md: FormatMarkDown): this;
  addMarkdown(...values: DataMarkDown['value']): this;
  /**
   * 添加纯 Markdown 文本
   */
  addMarkdownOriginal(val: string): this;
  /**
   * 添加附件
   */
  addAttachment(val: string, options?: DataAttachment['options']): this;
  /**
   * 添加音频
   */
  addAudio(val: string): this;
  /**
   * 添加视频
   */
  addVideo(val: string): this;
  /**
   * 添加链接
   * @deprecated 废弃，这个应该是md语法里的
   */
  addLink(val: DataLink['value'], options?: DataText['options']): this;
  /**
   * 添加图片文件
   * @deprecated 废弃，推荐使用 addImage
   */
  addImageFile(val: DataImageFile['value']): this;
  /**
   * 添加图片链接
   * @deprecated 废弃，推荐使用 addImage
   */
  addImageURL(val: DataImageURL['value']): this;
  /**
   * 添加下拉选择组件
   */
  addSelect(select: FormatSelect): this;
  addSelect(options: DataSelectOption[], meta?: DataSelect['options']): this;
  /**
   * 添加富媒体卡片
   */
  addEmbed(embed: DataEmbed['value']): this;
  /**
   * 清空
   */
  clear(): this;
}
//#endregion
export { Format, FormatButtonGroup, FormatMarkDown, FormatSelect };