//#region src/application/format/message-format.ts
var FormatButtonGroup = class {
	#rows = [];
	#currentRow = null;
	#options;
	/**
	* 获取按钮组数据
	*/
	get value() {
		this.#flush();
		return {
			type: "BT.group",
			value: this.#rows,
			...this.#options ? { options: this.#options } : {}
		};
	}
	/**
	* 小按钮样式：整个键盘使用小号按钮（QQ-Bot keyboard.content.style）
	*/
	smallButton() {
		this.#options = {
			...this.#options,
			smallButton: true
		};
		return this;
	}
	/**
	* 键盘级配置（QQ-Bot 专用）
	* @param options smallButton 小按钮 / rawData 键盘级原始字段透传
	*/
	setOptions(options) {
		this.#options = options;
		return this;
	}
	/**
	* 将当前行刷入 rows
	*/
	#flush() {
		if (this.#currentRow && this.#currentRow.length > 0) {
			this.#rows.push({
				type: "BT.row",
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
	absorb(group) {
		if (this.#currentRow && this.#currentRow.length > 0) this.#flush();
		this.#rows.push(...group.value.value);
		return this;
	}
	/**
	* 新增一行按钮
	* @returns 当前实例
	*/
	addRow() {
		this.#flush();
		this.#currentRow = [];
		return this;
	}
	/**
	* 添加一个按钮到当前行，若无行则自动创建
	*/
	addButton(title, data, options) {
		if (!this.#currentRow) this.#currentRow = [];
		this.#currentRow.push({
			type: "Button",
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
	clear() {
		this.#rows = [];
		this.#currentRow = null;
		return this;
	}
};
var FormatMarkDown = class FormatMarkDown {
	#data = [];
	/**
	* 获取 Markdown 数据
	*/
	get value() {
		return {
			type: "Markdown",
			value: this.#data
		};
	}
	/**
	* 吸收另一个 FormatMarkDown 的数据
	* @param md 要吸收的 FormatMarkDown 实例
	* @returns 当前实例
	*/
	absorb(md) {
		this.#data.push(...md.value.value);
		return this;
	}
	/**
	* 添加原始文本
	*/
	addContent(text) {
		this.#data.push({
			type: "MD.content",
			value: text
		});
		return this;
	}
	/**
	* 添加文本
	*/
	addText(text) {
		this.#data.push({
			type: "MD.text",
			value: text
		});
		return this;
	}
	/**
	* 添加标题
	*/
	addTitle(text) {
		this.#data.push({
			type: "MD.title",
			value: text
		});
		return this;
	}
	/**
	* 添加副标题
	*/
	addSubtitle(text) {
		this.#data.push({
			type: "MD.subtitle",
			value: text
		});
		return this;
	}
	/**
	* 添加粗体
	*/
	addBold(text) {
		this.#data.push({
			type: "MD.bold",
			value: text
		});
		return this;
	}
	/**
	* 添加斜体
	*/
	addItalic(text) {
		this.#data.push({
			type: "MD.italic",
			value: text
		});
		return this;
	}
	/**
	* 添加斜体（星号）
	*/
	addItalicStar(text) {
		this.#data.push({
			type: "MD.italicStar",
			value: text
		});
		return this;
	}
	/**
	* 添加删除线
	*/
	addStrikethrough(text) {
		this.#data.push({
			type: "MD.strikethrough",
			value: text
		});
		return this;
	}
	/**
	* 添加链接
	*/
	addLink(text, url) {
		this.#data.push({
			type: "MD.link",
			value: {
				text,
				url
			}
		});
		return this;
	}
	/**
	* 添加图片
	*/
	addImage(url, options) {
		this.#data.push({
			type: "MD.image",
			value: url,
			options
		});
		return this;
	}
	/**
	* 添加列表
	*/
	addList(...items) {
		this.#data.push({
			type: "MD.list",
			value: items.map((item) => typeof item === "object" && "type" in item ? item : {
				type: "MD.listItem",
				value: item
			})
		});
		return this;
	}
	/**
	* 添加完整引用块。支持旧字符串、Markdown 构建器或子节点数组。
	* 后续添加的节点位于引用外；字符串保持原有平台解释方式。
	*/
	addBlockquote(content) {
		this.#data.push({
			type: "MD.blockquote",
			value: content instanceof FormatMarkDown ? [...content.value.value] : Array.isArray(content) ? [...content] : content
		});
		return this;
	}
	/**
	* 添加分割线
	*/
	addDivider() {
		this.#data.push({ type: "MD.divider" });
		return this;
	}
	/**
	* 添加换行
	*/
	addNewline(value = false) {
		this.#data.push({
			type: "MD.newline",
			value
		});
		return this;
	}
	/**
	* 添加代码
	*/
	addCode(value, options) {
		this.#data.push({
			type: "MD.code",
			value,
			options
		});
		return this;
	}
	/**
	* 换行
	*/
	addBreak() {
		return this.addNewline();
	}
	addMention(uid, options) {
		this.#data.push({
			type: "MD.mention",
			value: uid || "everyone",
			options: options ?? { belong: "user" }
		});
		return this;
	}
	addButton(title, data) {
		this.#data.push({
			type: "MD.button",
			value: title,
			options: data
		});
		return this;
	}
	/**
	* 清空
	*/
	clear() {
		this.#data = [];
		return this;
	}
};
/**
* Select 构建器（选项组）
*/
var FormatSelect = class {
	#options = [];
	#meta = {};
	get value() {
		return {
			type: "Select",
			value: this.#options,
			options: this.#meta
		};
	}
	setCustomId(customId) {
		this.#meta.customId = customId;
		return this;
	}
	setPlaceholder(placeholder) {
		this.#meta.placeholder = placeholder;
		return this;
	}
	setRange(min, max) {
		if (min !== void 0) this.#meta.minValues = min;
		if (max !== void 0) this.#meta.maxValues = max;
		return this;
	}
	setKind(kind) {
		this.#meta.kind = kind;
		return this;
	}
	setDisabled(disabled = true) {
		this.#meta.disabled = disabled;
		return this;
	}
	addOption(label, value, extra) {
		this.#options.push({
			label,
			value,
			...extra
		});
		return this;
	}
	clear() {
		this.#options = [];
		this.#meta = {};
		return this;
	}
};
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
var Format = class Format {
	#data = [];
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
	get value() {
		return this.#data;
	}
	absorb(format) {
		this.#data.push(...format.value);
		return this;
	}
	/**
	* 添加文本
	*/
	addText(val, options) {
		this.#data.push({
			type: "Text",
			value: val,
			options
		});
		return this;
	}
	/**
	* 添加图片 (Buffer 或带协议字符串)
	*/
	addImage(val) {
		this.#data.push({
			type: "Image",
			value: typeof val === "string" ? val : `base64://${val.toString("base64")}`
		});
		return this;
	}
	/**
	* 添加提及
	*/
	addMention(UserId, options) {
		this.#data.push({
			type: "Mention",
			value: UserId,
			options: options ?? { belong: "user" }
		});
		return this;
	}
	addButtonGroup(...args) {
		if (args[0] instanceof FormatButtonGroup) this.#data.push(args[0].value);
		else this.#data.push({
			type: "BT.group",
			value: args
		});
		return this;
	}
	addMarkdown(...args) {
		if (args[0] instanceof FormatMarkDown) this.#data.push(args[0].value);
		else this.#data.push({
			type: "Markdown",
			value: args
		});
		return this;
	}
	/**
	* 添加纯 Markdown 文本
	*/
	addMarkdownOriginal(val) {
		this.#data.push({
			type: "MarkdownOriginal",
			value: val
		});
		return this;
	}
	/**
	* 添加附件
	*/
	addAttachment(val, options) {
		this.#data.push({
			type: "Attachment",
			value: val,
			options
		});
		return this;
	}
	/**
	* 添加音频
	*/
	addAudio(val) {
		this.#data.push({
			type: "Audio",
			value: val
		});
		return this;
	}
	/**
	* 添加视频
	*/
	addVideo(val) {
		this.#data.push({
			type: "Video",
			value: val
		});
		return this;
	}
	/**
	* 添加链接
	* @deprecated 废弃，这个应该是md语法里的
	*/
	addLink(val, options) {
		this.#data.push({
			type: "Text",
			value: val,
			options
		});
		return this;
	}
	/**
	* 添加图片文件
	* @deprecated 废弃，推荐使用 addImage
	*/
	addImageFile(val) {
		this.#data.push({
			type: "ImageFile",
			value: val
		});
		return this;
	}
	/**
	* 添加图片链接
	* @deprecated 废弃，推荐使用 addImage
	*/
	addImageURL(val) {
		this.#data.push({
			type: "ImageURL",
			value: val
		});
		return this;
	}
	addSelect(...args) {
		if (args[0] instanceof FormatSelect) this.#data.push(args[0].value);
		else this.#data.push({
			type: "Select",
			value: args[0],
			options: args[1] ?? {}
		});
		return this;
	}
	/**
	* 添加富媒体卡片
	*/
	addEmbed(embed) {
		this.#data.push({
			type: "Embed",
			value: embed
		});
		return this;
	}
	/**
	* 清空
	*/
	clear() {
		this.#data = [];
		return this;
	}
};

//#endregion
export { Format, FormatButtonGroup, FormatMarkDown, FormatSelect };