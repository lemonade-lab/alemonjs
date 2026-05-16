import { Events, EventKeys, EventBuilder, ReservedEventKeys, User, Guild, Channel, Message, MessageText, MessageMedia, MessageOpen, Platform } from '../types';

/**
 * 链式构建事件对象，根据事件名约束可用方法
 * @example
 * ```ts
 * // message.create 拥有全部字段方法
 * const msg = FormatEvent.create('message.create')
 *   .addPlatform({ Platform: 'discord', value: raw })
 *   .addGuild({ GuildId: 'g1', SpaceId: 's1' })
 *   .addChannel({ ChannelId: 'c1' })
 *   .addUser({ UserId: 'u1', UserKey: 'k1', IsMaster: false, IsBot: false })
 *   .addMessage({ MessageId: 'm1' })
 *   .addText({ MessageText: 'hello' })
 *   .addMedia({ MessageMedia: [{ Type: 'image', Url: '...' }] })
 *   .addOpen({ OpenId: 'o1' })
 *   .value;
 *
 * // private.message.delete 只有 addPlatform / addMessage
 * const del = FormatEvent.create('private.message.delete')
 *   .addPlatform({ Platform: 'qq', value: raw })
 *   .addMessage({ MessageId: 'm2' })
 *   .value;
 *   // del.addGuild → 类型错误 ✓
 * ```
 */
export class FormatEvent<T extends EventKeys = EventKeys> {
  #data: Events[T];

  private constructor(name: T) {
    this.#data = { name, Timestamp: Date.now() } as unknown as Events[T];
  }

  static create<T extends EventKeys>(name: T): EventBuilder<T> {
    return new FormatEvent(name) as unknown as EventBuilder<T>;
  }

  addPlatform(params: Platform): this {
    const { value, ...otherParams } = params;

    Object.assign(this.#data, otherParams);
    Object.defineProperty(this.#data, 'value', {
      value,
      enumerable: true
    });

    return this;
  }

  addGuild(params: Guild): this {
    Object.assign(this.#data, {
      GuildId: params.GuildId,
      SpaceId: params.SpaceId
    });

    return this;
  }

  addChannel(params: Channel): this {
    Object.assign(this.#data, {
      ChannelId: params.ChannelId
    });

    return this;
  }

  addUser(params: User): this {
    Object.assign(this.#data, {
      UserId: params.UserId,
      UserKey: params.UserKey,
      IsMaster: params.IsMaster,
      IsBot: params.IsBot,
      ...(params.UserName !== undefined && { UserName: params.UserName }),
      ...(params.UserAvatar !== undefined && { UserAvatar: params.UserAvatar })
    });

    return this;
  }

  addMessage(params: Message): this {
    const assign: Record<string, unknown> = { MessageId: params.MessageId };

    if (params.ReplyId !== undefined) {
      assign.ReplyId = params.ReplyId;
    }

    Object.assign(this.#data, assign);

    return this;
  }

  addText(params: MessageText): this {
    Object.assign(this.#data, {
      MessageText: params.MessageText
    });

    return this;
  }

  addMedia(params: MessageMedia): this {
    Object.assign(this.#data, {
      MessageMedia: params.MessageMedia
    });

    return this;
  }

  addOpen(params: MessageOpen): this {
    Object.assign(this.#data, {
      OpenId: params.OpenId
    });

    return this;
  }

  /**
   * 批量设置自定义扩展字段（非事件保留字段）
   * 所有 key 会自动加上 `_` 前缀存储，避免与事件标准字段冲突
   * @example
   * ```ts
   * FormatEvent.create('message.create')
   *   .add<MyEvent>({ rawType: 'GROUP_AT_MESSAGE_CREATE', tag: 'xxx' })
   *   // 实际存储为 { _rawType: '...', _tag: '...' }
   * ```
   */
  add<E extends Record<string, unknown>>(fields: { [K in keyof E]: K extends ReservedEventKeys ? never : E[K] }): this {
    for (const key of Object.keys(fields)) {
      (this.#data as any)[`_${key}`] = (fields as any)[key];
    }

    return this;
  }

  get value() {
    return this.#data;
  }
}

/**
 * 将事件对象包装为只读代理，访问自定义字段时自动解析 `_` 前缀
 *
 * - `event.rawType`        → 实际读取 `event._rawType`
 * - `event.GuildId`        → 正常读取
 * - `'rawType' in event`   → true（如果 `_rawType` 存在）
 * - `Object.keys(event)`   → `_rawType` 映射为 `rawType`
 * - `event.rawType = 'x'`  → 抛出 TypeError（只读）
 *
 * @example
 * ```ts
 * const raw = FormatEvent.create('message.create')
 *   .add<MyEvent>({ rawType: 'GROUP_AT_MESSAGE_CREATE' })
 *   .value;
 *
 * const event = wrapEvent<MyEvent>(raw);
 * event.rawType;   // 'GROUP_AT_MESSAGE_CREATE'
 * ```
 */
export function wrapEvent<E extends Record<string, unknown>>(event: object): Readonly<E> {
  return new Proxy(event, {
    get(target, prop, receiver) {
      if (typeof prop === 'string' && !prop.startsWith('_')) {
        const privateKey = `_${prop}`;

        if (privateKey in target) {
          return Reflect.get(target, privateKey, receiver);
        }
      }

      return Reflect.get(target, prop, receiver);
    },

    has(target, prop) {
      if (typeof prop === 'string' && !prop.startsWith('_')) {
        if (`_${prop}` in target) {
          return true;
        }
      }

      return Reflect.has(target, prop);
    },

    set() {
      return false;
    },

    deleteProperty() {
      return false;
    },

    ownKeys(target) {
      return Reflect.ownKeys(target).map(key => {
        if (typeof key === 'string' && key.startsWith('_')) {
          return key.slice(1);
        }

        return key;
      });
    },

    getOwnPropertyDescriptor(target, prop) {
      if (typeof prop === 'string' && !prop.startsWith('_')) {
        const privateKey = `_${prop}`;
        const desc = Reflect.getOwnPropertyDescriptor(target, privateKey);

        if (desc) {
          return { ...desc, configurable: true, writable: false };
        }
      }

      const desc = Reflect.getOwnPropertyDescriptor(target, prop);

      if (desc) {
        return { ...desc, writable: false };
      }

      return desc;
    }
  }) as unknown as Readonly<E>;
}
