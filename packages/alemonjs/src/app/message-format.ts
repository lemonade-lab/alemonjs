import {
  DataMention,
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
  DataMarkdownBlockquote,
  DataMarkdownDivider,
  DataMarkdownNewline,
  DataLink,
  DataMarkdownText,
  DataMarkdownCode,
  DataMarkdownOriginal,
  DataAttachment,
  DataMarkdownMention,
  DataMarkdownContent,
  DataMarkdownButton,
  DataEnums,
  DataSelect,
  DataSelectOption,
  DataEmbed
} from '../types';

export * from './message-format-old.js';

export class FormatButtonGroup {
  #rows: DataButtonRow[] = [];
  #currentRow: DataButton[] | null = null;

  /**
   * 获取按钮组数据
   */
  get value(): DataButtonGroup {
    this.#flush();

    return {
      type: 'BT.group',
      value: this.#rows
    };
  }

  /**
   * 将当前行刷入 rows
   */
  #flush(): void {
    if (this.#currentRow && this.#currentRow.length > 0) {
      this.#rows.push({
        type: 'BT.row',
        value: this.#currentRow
      });
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
  addButton(title: string, data: DataButton['options']['data'], options?: Omit<DataButton['options'], 'data'>): this {
    // 如果没有当前行，则自动创建
    if (!this.#currentRow) {
      this.#currentRow = [];
    }
    this.#currentRow.push({
      type: 'Button',
      value: title,
      options: {
        data,
        ...options
      }
    });

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
    return {
      type: 'Markdown',
      value: this.#data
    };
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
  addContent(text: string): this {
    this.#data.push({
      type: 'MD.content',
      value: text
    } as DataMarkdownContent);

    return this;
  }

  /**
   * 添加文本
   */
  addText(text: string): this {
    this.#data.push({
      type: 'MD.text',
      value: text
    } as DataMarkdownText);

    return this;
  }

  /**
   * 添加标题
   */
  addTitle(text: string): this {
    this.#data.push({
      type: 'MD.title',
      value: text
    } as DataMarkdownTitle);

    return this;
  }

  /**
   * 添加副标题
   */
  addSubtitle(text: string): this {
    this.#data.push({
      type: 'MD.subtitle',
      value: text
    } as DataMarkdownSubtitle);

    return this;
  }

  /**
   * 添加粗体
   */
  addBold(text: string): this {
    this.#data.push({
      type: 'MD.bold',
      value: text
    } as DataMarkdownBold);

    return this;
  }

  /**
   * 添加斜体
   */
  addItalic(text: string): this {
    this.#data.push({
      type: 'MD.italic',
      value: text
    } as DataMarkdownItalic);

    return this;
  }

  /**
   * 添加斜体（星号）
   */
  addItalicStar(text: string): this {
    this.#data.push({
      type: 'MD.italicStar',
      value: text
    } as DataMarkdownItalicStar);

    return this;
  }

  /**
   * 添加删除线
   */
  addStrikethrough(text: string): this {
    this.#data.push({
      type: 'MD.strikethrough',
      value: text
    } as DataMarkdownStrikethrough);

    return this;
  }

  /**
   * 添加链接
   */
  addLink(text: string, url?: string): this {
    this.#data.push({
      type: 'MD.link',
      value: { text, url }
    } as DataMarkdownLink);

    return this;
  }

  /**
   * 添加图片
   */
  addImage(url: string, options?: { width?: number; height?: number }): this {
    this.#data.push({
      type: 'MD.image',
      value: url,
      options
    } as DataMarkdownImage);

    return this;
  }

  /**
   * 添加列表
   */
  addList(...items: any[]): this {
    this.#data.push({
      type: 'MD.list',
      value: items
    } as DataMarkdownList);

    return this;
  }

  /**
   * 添加引用
   */
  addBlockquote(text: string): this {
    this.#data.push({
      type: 'MD.blockquote',
      value: text
    } as DataMarkdownBlockquote);

    return this;
  }

  /**
   * 添加分割线
   */
  addDivider(): this {
    this.#data.push({
      type: 'MD.divider'
    } as DataMarkdownDivider);

    return this;
  }

  /**
   * 添加换行
   */
  addNewline(value = false): this {
    this.#data.push({
      type: 'MD.newline',
      value
    } as DataMarkdownNewline);

    return this;
  }

  /**
   * 添加代码
   */
  addCode(value: DataMarkdownCode['value'], options?: DataMarkdownCode['options']): this {
    this.#data.push({
      type: 'MD.code',
      value,
      options
    } as DataMarkdownCode);

    return this;
  }

  /**
   * 换行
   */
  addBreak(): this {
    return this.addNewline();
  }

  addMention(uid?: string, options?: DataMarkdownMention['options']): this {
    this.#data.push({
      type: 'MD.mention',
      value: uid || 'everyone',
      options: options ?? { belong: 'user' }
    } as DataMarkdownMention);

    return this;
  }

  addButton(title: string, data: DataMarkdownButton['options']): this {
    this.#data.push({
      type: 'MD.button',
      value: title,
      options: data
    } as DataMarkdownButton);

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
 * Select 构建器（选项组）
 */
export class FormatSelect {
  #options: DataSelectOption[] = [];
  #meta: DataSelect['options'] = {};

  get value(): DataSelect {
    return {
      type: 'Select',
      value: this.#options,
      options: this.#meta
    };
  }

  setCustomId(customId: string): this {
    this.#meta.customId = customId;

    return this;
  }

  setPlaceholder(placeholder: string): this {
    this.#meta.placeholder = placeholder;

    return this;
  }

  setRange(min?: number, max?: number): this {
    if (min !== undefined) {
      this.#meta.minValues = min;
    }
    if (max !== undefined) {
      this.#meta.maxValues = max;
    }

    return this;
  }

  setKind(kind: DataSelect['options']['kind']): this {
    this.#meta.kind = kind;

    return this;
  }

  setDisabled(disabled = true): this {
    this.#meta.disabled = disabled;

    return this;
  }

  addOption(label: string, value: string, extra?: Omit<DataSelectOption, 'label' | 'value'>): this {
    this.#options.push({ label, value, ...extra });

    return this;
  }

  clear(): this {
    this.#options = [];
    this.#meta = {};

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
   * 创建一个新的 Select 实例
   */
  static createSelect() {
    return new FormatSelect();
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
  addText(val: DataText['value'], options?: DataText['options']): this {
    this.#data.push({
      type: 'Text',
      value: val,
      options
    });

    return this;
  }

  /**
   * 添加图片 (Buffer 或带协议字符串)
   */
  addImage(val: Buffer | string): this {
    this.#data.push({
      type: 'Image',
      value: typeof val === 'string' ? val : `base64://${val.toString('base64')}`
    });

    return this;
  }

  /**
   * 添加提及
   */
  addMention(UserId?: DataMention['value'], options?: DataMention['options']): this {
    this.#data.push({
      type: 'Mention',
      value: UserId,
      options: options ?? { belong: 'user' }
    });

    return this;
  }

  /**
   * 添加按钮组
   */
  addButtonGroup(bt: FormatButtonGroup): this;
  addButtonGroup(...rows: DataButtonRow[]): this;
  addButtonGroup(...args: [FormatButtonGroup] | DataButtonRow[]): this {
    if (args[0] instanceof FormatButtonGroup) {
      this.#data.push(args[0].value);
    } else {
      this.#data.push({
        type: 'BT.group',
        value: args as DataButtonRow[]
      });
    }

    return this;
  }

  /**
   * 添加结构化 Markdown
   */
  addMarkdown(md: FormatMarkDown): this;
  addMarkdown(...values: DataMarkDown['value']): this;
  addMarkdown(...args: [FormatMarkDown] | DataMarkDown['value']): this {
    if (args[0] instanceof FormatMarkDown) {
      this.#data.push(args[0].value);
    } else {
      this.#data.push({
        type: 'Markdown',
        value: args as DataMarkDown['value']
      });
    }

    return this;
  }

  /**
   * 添加纯 Markdown 文本
   */
  addMarkdownOriginal(val: string): this {
    this.#data.push({
      type: 'MarkdownOriginal',
      value: val
    } as DataMarkdownOriginal);

    return this;
  }

  /**
   * 添加附件
   */
  addAttachment(val: string, options?: DataAttachment['options']): this {
    this.#data.push({
      type: 'Attachment',
      value: val,
      options
    });

    return this;
  }

  /**
   * 添加音频
   */
  addAudio(val: string): this {
    this.#data.push({
      type: 'Audio',
      value: val
    });

    return this;
  }

  /**
   * 添加视频
   */
  addVideo(val: string): this {
    this.#data.push({
      type: 'Video',
      value: val
    });

    return this;
  }

  /**
   * 添加链接
   * @deprecated 废弃，这个应该是md语法里的
   */
  addLink(val: DataLink['value'], options?: DataText['options']): this {
    this.#data.push({
      type: 'Text',
      value: val,
      options
    });

    return this;
  }

  /**
   * 添加图片文件
   * @deprecated 废弃，推荐使用 addImage
   */
  addImageFile(val: DataImageFile['value']): this {
    this.#data.push({
      type: 'ImageFile',
      value: val
    });

    return this;
  }

  /**
   * 添加图片链接
   * @deprecated 废弃，推荐使用 addImage
   */
  addImageURL(val: DataImageURL['value']): this {
    this.#data.push({
      type: 'ImageURL',
      value: val
    });

    return this;
  }

  /**
   * 添加下拉选择组件
   */
  addSelect(select: FormatSelect): this;
  addSelect(options: DataSelectOption[], meta?: DataSelect['options']): this;
  addSelect(...args: [FormatSelect] | [DataSelectOption[], DataSelect['options']?]): this {
    if (args[0] instanceof FormatSelect) {
      this.#data.push(args[0].value);
    } else {
      this.#data.push({
        type: 'Select',
        value: args[0],
        options: args[1] ?? {}
      });
    }

    return this;
  }

  /**
   * 添加富媒体卡片
   */
  addEmbed(embed: DataEmbed['value']): this {
    this.#data.push({
      type: 'Embed',
      value: embed
    });

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
