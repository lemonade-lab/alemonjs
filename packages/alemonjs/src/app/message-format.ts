import { DataButtonRow, DataButtonGroup, DataButton, DataMarkDown, DataEnums, EventKeys, Events } from '../types';

import { Text, Image, Link, ImageFile, ImageURL, Mention, BT, MD, MarkdownOriginal, Attachment, Audio, Video } from './message-format-old.js';

export * from './message-format-old.js';

export class FormatButtonGroup {
  #rows: DataButtonRow[] = [];
  #currentRow: DataButton[] | null = null;

  /**
   * 获取按钮组数据
   */
  get value(): DataButtonGroup {
    this.#flush();

    return BT.group(...this.#rows);
  }

  /**
   * 将当前行刷入 rows
   */
  #flush(): void {
    if (this.#currentRow && this.#currentRow.length > 0) {
      this.#rows.push(BT.row(...this.#currentRow));
      this.#currentRow = null;
    }
  }

  /**
   * 吸收另一个 FormatButtonGroup 的数据
   * @param group 要吸收的 FormatButtonGroup 实例
   * @returns 当前实例
   */
  absorb(group: FormatButtonGroup): this {
    // 如果当前有row且不是空的，则新增一行
    if (this.#currentRow && this.#currentRow.length > 0) {
      this.#flush();
    }
    // 吸收另一个实例的所有行
    this.#rows.push(...group.value.value);

    return this;
  }

  /**
   * 新增一行按钮
   * @returns 当前实例
   */
  addRow(): this {
    this.#flush();
    this.#currentRow = [];

    return this;
  }

  /**
   * 添加一个按钮到当前行，若无行则自动创建
   */
  addButton(...args: Parameters<typeof BT>): this {
    if (!this.#currentRow) {
      this.#currentRow = [];
    }

    this.#currentRow.push(BT(...args));

    return this;
  }

  /**
   * 清空
   */
  clear(): this {
    this.#rows = [];
    this.#currentRow = null;

    return this;
  }
}

export class FormatMarkDown {
  #data: DataMarkDown['value'] = [];

  /**
   * 获取 Markdown 数据
   */
  get value(): DataMarkDown {
    return MD(...this.#data);
  }

  /**
   * 吸收另一个 FormatMarkDown 的数据
   * @param md 要吸收的 FormatMarkDown 实例
   * @returns 当前实例
   */
  absorb(md: FormatMarkDown): this {
    this.#data.push(...md.value.value);

    return this;
  }

  /**
   * 添加原始文本
   */
  addContent(...args: Parameters<typeof MD.content>): this {
    this.#data.push(MD.content(...args));

    return this;
  }

  /**
   * 添加文本
   */
  addText(...args: Parameters<typeof MD.text>): this {
    this.#data.push(MD.text(...args));

    return this;
  }

  /**
   * 添加标题
   */
  addTitle(...args: Parameters<typeof MD.title>): this {
    this.#data.push(MD.title(...args));

    return this;
  }

  /**
   * 添加副标题
   */
  addSubtitle(...args: Parameters<typeof MD.subtitle>): this {
    this.#data.push(MD.subtitle(...args));

    return this;
  }

  /**
   * 添加粗体
   */
  addBold(...args: Parameters<typeof MD.bold>): this {
    this.#data.push(MD.bold(...args));

    return this;
  }

  /**
   * 添加斜体
   */
  addItalic(...args: Parameters<typeof MD.italic>): this {
    this.#data.push(MD.italic(...args));

    return this;
  }

  /**
   * 添加斜体（星号）
   */
  addItalicStar(...args: Parameters<typeof MD.italicStar>): this {
    this.#data.push(MD.italicStar(...args));

    return this;
  }

  /**
   * 添加删除线
   */
  addStrikethrough(...args: Parameters<typeof MD.strikethrough>): this {
    this.#data.push(MD.strikethrough(...args));

    return this;
  }

  /**
   * 添加链接
   */
  addLink(...args: Parameters<typeof MD.link>): this {
    this.#data.push(MD.link(...args));

    return this;
  }

  /**
   * 添加图片
   */
  addImage(...args: Parameters<typeof MD.image>): this {
    this.#data.push(MD.image(...args));

    return this;
  }

  /**
   * 添加列表
   */
  addList(...args: Parameters<typeof MD.list>): this {
    this.#data.push(MD.list(...args));

    return this;
  }

  /**
   * 添加引用
   */
  addBlockquote(...args: Parameters<typeof MD.blockquote>): this {
    this.#data.push(MD.blockquote(...args));

    return this;
  }

  /**
   * 添加分割线
   */
  addDivider(): this {
    this.#data.push(MD.divider());

    return this;
  }

  /**
   * 添加换行
   */
  addNewline(...args: Parameters<typeof MD.newline>): this {
    this.#data.push(MD.newline(...args));

    return this;
  }

  /**
   * 添加代码
   */
  addCode(...args: Parameters<typeof MD.code>): this {
    this.#data.push(MD.code(...args));

    return this;
  }

  /**
   * 换行
   */
  addBreak(): this {
    this.#data.push(MD.newline());

    return this;
  }

  addMention(...args: Parameters<typeof MD.mention>): this {
    this.#data.push(MD.mention(...args));

    return this;
  }

  addButton(...args: Parameters<typeof MD.button>): this {
    this.#data.push(MD.button(...args));

    return this;
  }

  /**
   * 清空
   */
  clear(): this {
    this.#data = [];

    return this;
  }
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
export class Format {
  #data: DataEnums[] = [];

  /**
   * 创建一个新的 Format 实例
   */
  static create() {
    return new Format();
  }

  /**
   * 创建一个新的 Markdown Format 实例
   */
  static createMarkdown() {
    return new FormatMarkDown();
  }

  /**
   * 创建一个新的 Button Format 实例
   */
  static createButtonGroup() {
    return new FormatButtonGroup();
  }

  /**
   * 获取内部格式化数据
   */
  get value(): DataEnums[] {
    return this.#data;
  }

  absorb(format: Format): this {
    this.#data.push(...format.value);

    return this;
  }

  /**
   * 添加文本
   */
  addText(...args: Parameters<typeof Text>) {
    this.#data.push(Text(...args));

    return this;
  }

  /**
   * 添加图片 (Buffer 或带协议字符串)
   */
  addImage(...args: Parameters<typeof Image>) {
    this.#data.push(Image(...args));

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
  addButtonGroup(bt: FormatButtonGroup): this;
  addButtonGroup(...args: Parameters<typeof BT.group>): this;
  addButtonGroup(...args: [FormatButtonGroup] | Parameters<typeof BT.group>) {
    if (args[0] instanceof FormatButtonGroup) {
      this.#data.push(args[0].value);
    } else {
      this.#data.push(BT.group(...(args as DataButtonRow[])));
    }

    return this;
  }

  /**
   * 添加结构化 Markdown
   */
  addMarkdown(md: FormatMarkDown): this;
  addMarkdown(...args: Parameters<typeof MD>): this;
  addMarkdown(...args: [FormatMarkDown] | Parameters<typeof MD>) {
    if (args[0] instanceof FormatMarkDown) {
      this.#data.push(args[0].value);
    } else {
      this.#data.push(MD(...(args as DataMarkDown['value'])));
    }

    return this;
  }

  /**
   * 添加纯 Markdown 文本
   */
  addMarkdownOriginal(...args: Parameters<typeof MarkdownOriginal>) {
    this.#data.push(MarkdownOriginal(...args));

    return this;
  }

  /**
   * 添加附件
   */
  addAttachment(...args: Parameters<typeof Attachment>) {
    this.#data.push(Attachment(...args));

    return this;
  }

  /**
   * 添加音频
   */
  addAudio(...args: Parameters<typeof Audio>) {
    this.#data.push(Audio(...args));

    return this;
  }

  /**
   * 添加视频
   */
  addVideo(...args: Parameters<typeof Video>) {
    this.#data.push(Video(...args));

    return this;
  }

  /**
   * 添加链接
   * @deprecated 废弃，这个应该是md语法里的
   */
  addLink(...args: Parameters<typeof Link>) {
    this.#data.push(Link(...args));

    return this;
  }

  /**
   * 添加图片文件
   * @deprecated 废弃，推荐使用 addImage
   */
  addImageFile(...args: Parameters<typeof ImageFile>) {
    this.#data.push(ImageFile(...args));

    return this;
  }

  /**
   * 添加图片链接
   * @deprecated 废弃，推荐使用 addImage
   */
  addImageURL(...args: Parameters<typeof ImageURL>) {
    this.#data.push(ImageURL(...args));

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
