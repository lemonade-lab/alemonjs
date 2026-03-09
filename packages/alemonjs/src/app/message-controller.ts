import { DataEnums } from '../types';
import { BT, Format, Image, ImageFile, ImageURL, Link, MD, Mention, Text } from './message-format';
import { Result } from '../core/utils';

type MessageParams = {
  format: Format | DataEnums[];
};

type SendRawFn = (val: DataEnums[]) => Promise<Result[]>;
type ResolveFormatFn = (params: MessageParams) => DataEnums[];

/**
 * 完整的消息控制器实现 — 仅在需要 builder 方法时由 useMessage 延迟创建
 */
export class MessageControllerImpl {
  #format: DataEnums[] = [];
  #sendRaw: SendRawFn;
  #resolveFormat: ResolveFormatFn;

  constructor(sendRaw: SendRawFn, resolveFormat: ResolveFormatFn) {
    this.#sendRaw = sendRaw;
    this.#resolveFormat = resolveFormat;
  }

  get currentFormat() {
    return this.#format;
  }

  addText(...args: Parameters<typeof Text>) {
    this.#format.push(Text(...args));

    return this;
  }

  addLink(...args: Parameters<typeof Link>) {
    this.#format.push(Link(...args));

    return this;
  }

  addImage(...args: Parameters<typeof Image>) {
    this.#format.push(Image(...args));

    return this;
  }

  addImageFile(...args: Parameters<typeof ImageFile>) {
    this.#format.push(ImageFile(...args));

    return this;
  }

  addImageURL(...args: Parameters<typeof ImageURL>) {
    this.#format.push(ImageURL(...args));

    return this;
  }

  addMention(...args: Parameters<typeof Mention>) {
    this.#format.push(Mention(...args));

    return this;
  }

  addButtonGroup(...args: Parameters<typeof BT.group>) {
    this.#format.push(BT.group(...args));

    return this;
  }

  addMarkdown(...args: Parameters<typeof MD>) {
    this.#format.push(MD(...args));

    return this;
  }

  addFormat(val: DataEnums[]) {
    this.#format.push(...val);

    return this;
  }

  clear() {
    this.#format = [];

    return this;
  }

  send(params?: MessageParams | DataEnums[]) {
    if (!params) {
      return this.#sendRaw(this.#format);
    }
    if (Array.isArray(params)) {
      const dataToSend = params.length > 0 ? params : this.#format;

      return this.#sendRaw(dataToSend);
    }

    return this.#sendRaw(this.#resolveFormat(params));
  }
}
