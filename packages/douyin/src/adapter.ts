import { FormatEvent, type ConnectionStatus } from 'alemonjs/platform';
import { ResultCode } from 'alemonjs/common';
import { getMaster, platform } from './config.js';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { loadMedia } from './media.js';
import {
  message,
  pickImageUrl,
  parseMessageContent,
  type AccountMap,
  type DouyinAccount,
  type ConversationAddress,
  type InboundMessage,
  type NoticeEvent,
  type RequestEvent,
  type ActionResult,
  type SendMessageResponse
} from './sdk/index.js';

type Payload = Record<string, any>;
type Emit = (event: any) => void;
const result = (code: ResultCode, message: string, data: any = null) => ({ code, message, data });

class ParamsError extends Error {}
const required = (value: unknown, label: string): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ParamsError(`${label} 必须是非空字符串`);
  }

  return value;
};
const boundedSet = <T>(map: Map<string, T>, key: string, value: T) => {
  map.delete(key);
  map.set(key, value);
  if (map.size > 2048) {
    map.delete(map.keys().next().value);
  }
};

const mentionIds = (content: string): string[] => {
  try {
    const value = JSON.parse(content);

    return Array.isArray(value.richTextInfos)
      ? value.richTextInfos.filter((item: Payload) => item.infoType === 1 && typeof item.info?.uid === 'string').map((item: Payload) => item.info.uid)
      : [];
  } catch {
    return [];
  }
};

/** Render structured Markdown as plain text, without stringifying objects. */
const markdownText = (nodes: Payload[]): string => {
  if (!Array.isArray(nodes)) {
    throw new ParamsError('Markdown 内容必须是数组');
  }

  return nodes
    .map(node => {
      if (node.type === 'MD.newline') {
        return '\n';
      }
      if (node.type === 'MD.divider') {
        return '\n---\n';
      }
      if (node.type === 'MD.link') {
        return `${node.value?.text ?? ''} (${required(node.value?.url, 'Markdown 链接')})`;
      }
      if (node.type === 'MD.list') {
        if (!Array.isArray(node.value)) {
          throw new ParamsError('Markdown 列表无效');
        }

        return node.value
          .map((item: Payload) => (typeof item.value === 'string' ? `- ${item.value}` : `${item.value?.index}. ${item.value?.text ?? ''}`))
          .join('\n');
      }
      if (
        ['MD.text', 'MD.content', 'MD.title', 'MD.subtitle', 'MD.bold', 'MD.italic', 'MD.italicStar', 'MD.strikethrough', 'MD.blockquote', 'MD.code'].includes(
          node.type
        ) &&
        typeof node.value === 'string'
      ) {
        return node.value;
      }
      throw new ParamsError(`不支持 Markdown 节点 ${String(node.type)}`);
    })
    .join('');
};

/** CBP-facing adapter. Construction is inert; accounts and event sink are injectable. */
export class DouyinAdapter {
  private readonly addresses = new Map<string, ConversationAddress>();
  private readonly messages = new Map<string, { address: ConversationAddress; message: InboundMessage }>();
  private readonly states = new Map<string, ConnectionStatus['bots'][number]>();
  private readonly disposers: Array<() => void> = [];
  private readonly uploads = new Map<string, { bot: string; type: string; asset: any }>();
  private stopped = false;
  private assertRunning() {
    if (this.stopped) {
      throw new ParamsError('适配器已停止');
    }
  }
  constructor(private readonly accounts: AccountMap, private readonly emit: Emit, private readonly defaultBotId?: string) {}

  getStatus(): ConnectionStatus {
    const bots = [...this.accounts.values()].map(
      account =>
        this.states.get(account.platformUid) ?? {
          BotId: account.platformUid,
          state: account.client.connected ? ('ready' as const) : ('idle' as const),
          transport: 'websocket'
        }
    );
    const state = this.stopped
      ? 'stopped'
      : bots.some(bot => bot.state === 'ready')
      ? 'ready'
      : bots.some(bot => bot.state === 'reconnecting')
      ? 'reconnecting'
      : bots.some(bot => bot.state === 'connecting')
      ? 'connecting'
      : bots.length
      ? 'offline'
      : 'idle';

    return { Platform: platform, state, bots };
  }

  async start(account: DouyinAccount): Promise<void> {
    if (this.stopped || this.states.has(account.platformUid)) {
      return;
    }
    const uid = account.platformUid;
    const state: ConnectionStatus['bots'][number] = { BotId: uid, state: 'connecting', transport: 'websocket' };

    this.states.set(uid, state);
    let readyOnce = false;
    const ready = () => {
      if (this.stopped) {
        return;
      }
      state.state = 'ready';
      state.lastError = undefined;
      state.reconnectAttempts = 0;
      this.emit({ name: 'connection.ready', Platform: platform, value: '', BotId: uid, transport: 'websocket', resumed: readyOnce });
      readyOnce = true;
    };
    const onMessage = (event: InboundMessage) => {
      if (!this.stopped) {
        this.receiveMessage(uid, event);
      }
    };
    const onNotice = (event: NoticeEvent) => {
      if (!this.stopped) {
        this.receiveNotice(uid, event);
      }
    };
    const onRequest = (event: RequestEvent) => {
      void this.receiveRequest(uid, event).catch(() => {
        state.lastError = '申请详情获取失败';
      });
    };
    const reconnecting = (event: { attempt: number }) => {
      state.state = 'reconnecting';
      state.reconnectAttempts = event.attempt;
    };
    const close = () => {
      state.state = this.stopped ? 'stopped' : 'offline';
    };
    const error = () => {
      state.lastError = '抖音传输失败';
    };

    account.client.on('ready', ready);
    account.client.on('message', onMessage);
    account.client.on('notice', onNotice);
    account.client.on('request', onRequest);
    account.client.on('reconnecting', reconnecting);
    account.client.on('close', close);
    account.client.on('error', error);
    this.disposers.push(() => {
      account.client.off('ready', ready);
      account.client.off('message', onMessage);
      account.client.off('notice', onNotice);
      account.client.off('request', onRequest);
      account.client.off('reconnecting', reconnecting);
      account.client.off('close', close);
      account.client.off('error', error);
      account.client.stop();
    });
    try {
      await account.client.start();
    } catch {
      state.state = this.stopped ? 'stopped' : 'offline';
      state.lastError = '抖音连接失败';
    }
  }

  stop(): void {
    if (this.stopped) {
      return;
    }
    this.stopped = true;
    for (const dispose of this.disposers.splice(0)) {
      dispose();
    }
    for (const state of this.states.values()) {
      state.state = 'stopped';
    }
    this.addresses.clear();
    this.messages.clear();
    this.uploads.clear();
  }

  private user(uid: string, nickname?: string, avatar?: string) {
    const [IsMaster, UserKey] = getMaster(uid);

    return { UserId: uid, UserKey, IsMaster, IsBot: this.accounts.has(uid), UserName: nickname, UserAvatar: avatar };
  }

  private remember(bot: string, address: ConversationAddress, peer?: string) {
    if (!address.conversationId || !address.conversationShortId) {
      return;
    }
    const scope = address.conversationType === 2 ? 'group' : 'c2c';

    for (const id of [address.conversationId, address.conversationShortId, ...(peer ? [peer] : [])]) {
      boundedSet(this.addresses, `${bot}:${scope}:${id}`, address);
    }
  }

  receiveMessage(bot: string, incoming: InboundMessage): void {
    if (this.stopped || incoming.senderUid === bot || !incoming.senderUid || !incoming.serverMessageId || ![1, 2].includes(incoming.conversationType)) {
      return;
    }
    const address: ConversationAddress = {
      conversationId: incoming.conversationId,
      conversationShortId: incoming.conversationShortId,
      conversationType: incoming.conversationType as 1 | 2,
      inboxType: incoming.inboxType
    };

    this.remember(bot, address, address.conversationType === 1 ? incoming.senderUid : undefined);
    boundedSet(this.messages, `${bot}:${incoming.serverMessageId}`, { address, message: incoming });
    const group = address.conversationType === 2;
    // Only routing metadata crosses CBP, never the SDK raw packet or session.
    const builder = FormatEvent.create(group ? 'message.create' : 'private.message.create')
      .addPlatform({ Platform: platform, BotId: bot, value: address, IsPrivate: !group, IsAtMe: mentionIds(incoming.content).includes(bot) })
      .addUser(this.user(incoming.senderUid))
      .addMessage({ MessageId: incoming.serverMessageId, ReplyId: incoming.reference?.referencedMessageId })
      .addText({ MessageText: incoming.text })
      .addOpen({ OpenId: incoming.senderUid });

    if (group) {
      (builder as any).addGuild({ GuildId: address.conversationId, SpaceId: address.conversationId }).addChannel({ ChannelId: address.conversationId });
    }
    const parsed = incoming.parsed;
    const media =
      parsed.kind === 'image'
        ? { Type: 'image', FileId: parsed.image.oid, ...(!parsed.image.skey ? { Url: pickImageUrl(parsed.image) } : {}) }
        : parsed.kind === 'video'
        ? { Type: 'video', FileId: parsed.video.tkey }
        : parsed.kind === 'file'
        ? { Type: 'file', FileId: parsed.file.uri, FileName: parsed.file.name, FileSize: parsed.file.dataSize }
        : parsed.kind === 'audio'
        ? { Type: 'audio', FileId: parsed.audio.uri, Url: parsed.audio.urls[0] }
        : parsed.kind === 'emoji'
        ? { Type: 'sticker', Url: parsed.url }
        : undefined;

    if (media) {
      builder.addMedia({ MessageMedia: [media as any] });
    }
    this.emit(builder.value);
  }

  receiveNotice(bot: string, notice: NoticeEvent): void {
    if (this.stopped) {
      return;
    }
    const id = 'conversationId' in notice ? notice.conversationId : '';
    const group = 'conversationType' in notice ? notice.conversationType === 2 : /^\d+$/.test(id);

    if ('conversationShortId' in notice) {
      this.remember(bot, { conversationId: id, conversationShortId: notice.conversationShortId, conversationType: 2 });
    }
    const name =
      notice.type === 'message.recall'
        ? group
          ? 'message.delete'
          : 'private.message.delete'
        : notice.type === 'message.reaction' && group
        ? notice.isSet
          ? 'message.reaction.add'
          : 'message.reaction.remove'
        : notice.type === 'group.member-increase'
        ? 'member.add'
        : notice.type === 'group.member-decrease'
        ? 'member.remove'
        : notice.type === 'group.admin'
        ? 'member.update'
        : notice.type === 'group.name-change' || notice.type === 'group.avatar-change'
        ? 'guild.update'
        : notice.type === 'friend.decrease'
        ? 'private.friend.remove'
        : group
        ? 'notice.create'
        : 'private.notice.create';
    const members = 'members' in notice ? notice.members : [{ uid: 'peerUid' in notice ? notice.peerUid : 'operatorUid' in notice ? notice.operatorUid : bot }];

    for (const member of members) {
      const eventName = member.uid === bot && name === 'member.add' ? 'guild.join' : member.uid === bot && name === 'member.remove' ? 'guild.exit' : name;
      const builder = FormatEvent.create(eventName as any).addPlatform({
        Platform: platform,
        BotId: bot,
        value: { conversationId: id },
        IsPrivate: !group
      }) as any;

      builder.addUser(this.user(member.uid, 'nickname' in member ? member.nickname : undefined));
      if (group) {
        builder.addGuild({ GuildId: id, SpaceId: id }).addChannel({ ChannelId: id });
      }
      if ('serverMessageId' in notice) {
        builder.addMessage({ MessageId: notice.serverMessageId ?? '' });
      }
      this.emit(
        builder.add({
          noticeType: notice.type,
          operators: 'operators' in notice ? notice.operators.map(user => user.uid) : [],
          emojiId: 'emoji' in notice ? notice.emoji : undefined,
          isSet: 'isSet' in notice ? notice.isSet : undefined,
          guildName: 'name' in notice ? notice.name : undefined,
          guildAvatar: 'avatar' in notice ? notice.avatar : undefined
        }).value
      );
    }
  }

  async receiveRequest(bot: string, request: RequestEvent): Promise<void> {
    if (this.stopped) {
      return;
    }
    const rows =
      request.type === 'friend.request'
        ? [{ uid: request.applicantUid, flag: request.applicantUid, groupId: '', content: request.content }]
        : (await this.accounts.get(bot).client.getGroupJoinRequests({ conversationShortId: request.conversationShortId }))
            .filter(row => row.status === 1 && (!request.requestId || row.requestId === request.requestId))
            .map(row => ({ uid: row.applicantUid, flag: row.requestId, groupId: row.groupShortId, content: row.reason }));

    if (this.stopped) {
      return;
    }
    for (const row of rows) {
      this.emit(
        FormatEvent.create(request.type === 'friend.request' ? 'private.friend.add' : 'private.guild.add')
          .addPlatform({ Platform: platform, BotId: bot, value: { flag: row.flag, groupId: row.groupId }, IsPrivate: true })
          .addUser(this.user(row.uid))
          .addMessage({ MessageId: row.flag })
          .add({ flag: row.flag, subType: 'add', groupId: row.groupId, comment: row.content }).value
      );
    }
  }

  private account(payload: Payload): DouyinAccount {
    const ids = [payload.BotId, payload.target?.BotId, payload.event?.BotId].filter(value => value !== undefined);

    if (ids.some(id => typeof id !== 'string' || !id) || new Set(ids).size > 1) {
      throw new ParamsError('BotId 无效或相互冲突');
    }
    const id = ids[0] ?? this.defaultBotId ?? (this.accounts.size === 1 ? this.accounts.keys().next().value : undefined);
    const account = id ? this.accounts.get(id) : undefined;

    if (!account) {
      throw new ParamsError('未找到账号；多账号必须指定 BotId');
    }

    return account;
  }

  private async address(account: DouyinAccount, payload: Payload): Promise<ConversationAddress> {
    const event = payload.event;

    if (event?.Platform && event.Platform !== platform) {
      throw new ParamsError('事件不属于 douyin');
    }
    const scope = payload.target?.scope ?? (payload.ChannelId || event?.ChannelId ? 'group' : 'c2c');

    if (scope !== 'group' && scope !== 'c2c') {
      throw new ParamsError('抖音仅支持 group / c2c 会话');
    }
    const id = required(payload.target?.targetId ?? payload.ChannelId ?? payload.UserId ?? event?.ChannelId ?? event?.UserId, '目标 ID');
    const cached = this.addresses.get(`${account.platformUid}:${scope}:${id}`);

    if (cached) {
      return cached;
    }
    if (scope === 'group') {
      const found = (await account.client.getGroupList()).find(item => item.conversationId === id || item.conversationShortId === id);

      this.assertRunning();

      if (found) {
        const address: ConversationAddress = { conversationId: found.conversationId, conversationShortId: found.conversationShortId, conversationType: 2 };

        this.remember(account.platformUid, address);

        return address;
      }
    } else {
      let found = (await account.client.getFriendList()).find(item => item.uid === id || item.conversationId === id);

      found ??= (await account.client.getStrangerList()).find(item => item.uid === id || item.conversationId === id) as typeof found;
      this.assertRunning();
      if (found) {
        const address: ConversationAddress = { conversationId: found.conversationId, conversationShortId: found.conversationShortId, conversationType: 1 };

        this.remember(account.platformUid, address, found.uid);

        return address;
      }
    }
    throw new ParamsError('会话不存在或缺少完整寻址信息');
  }

  private response(response: ActionResult & Partial<SendMessageResponse> & { recalled?: boolean }, sending = false) {
    if (response.statusCode !== 0 || response.recalled === false) {
      return result(ResultCode.Fail, '抖音拒绝操作', { statusCode: response.statusCode });
    }
    if (response.checkCode) {
      return result(ResultCode.Warn, '消息未确认送达：内容审核未通过或待审核', { checkCode: response.checkCode });
    }
    if (sending && (!response.serverMessageId || response.serverMessageId === '0')) {
      return result(ResultCode.Fail, '发送响应缺少服务端消息 ID');
    }

    return result(ResultCode.Ok, 'ok', sending ? { id: String(response.serverMessageId) } : null);
  }

  private async upload(account: DouyinAccount, params: Payload) {
    if (params.type !== 'image' && params.type !== 'file') {
      throw new ParamsError('框架媒体动作支持 image / file；视频需要通过 SDK 提供封面及尺寸，音频暂不支持');
    }
    if (params.fileId) {
      const cached = this.uploads.get(params.fileId);

      if (cached?.bot !== account.platformUid || cached.type !== params.type) {
        throw new ParamsError('上传凭据不存在、类型不符或属于其他账号');
      }

      return { fileId: params.fileId as string, ...cached };
    }
    const sources = [params.url, params.data, params.filePath].filter(value => value !== undefined);

    if (sources.length !== 1) {
      throw new ParamsError('url、data、filePath 必须且只能提供一个');
    }
    const source =
      params.url !== undefined
        ? required(params.url, 'url')
        : params.filePath !== undefined
        ? pathToFileURL(required(params.filePath, 'filePath')).href
        : `base64://${required(params.data, 'data')}`;
    const bytes = await loadMedia(source);

    if (this.stopped) {
      throw new ParamsError('适配器已停止');
    }
    const asset = params.type === 'image' ? await account.client.uploadImage(bytes) : await account.client.uploadFile(bytes, required(params.name, '文件名'));
    const fileId = randomUUID();
    const cached = { bot: account.platformUid, type: params.type as string, asset };

    if (this.stopped) {
      throw new ParamsError('适配器已停止');
    }
    boundedSet(this.uploads, fileId, cached);

    return { fileId, ...cached };
  }

  async handle(action: string, payload: Payload = {}): Promise<ReturnType<typeof result>[]> {
    try {
      if (action === 'connection.status') {
        return [result(ResultCode.Ok, 'ok', this.getStatus())];
      }
      if (this.stopped) {
        return [result(ResultCode.Fail, '适配器已停止')];
      }
      const account = this.account(payload);
      const client = account.client;
      const params = payload.params ?? {};
      const ok = (data: unknown) => [result(ResultCode.Ok, 'ok', data)];

      if (['media.upload', 'media.send', 'media.send.user', 'media.send.channel', 'file.send.user', 'file.send.channel'].includes(action)) {
        const address = action === 'media.upload' ? undefined : await this.address(account, payload);
        const mediaParams = action.startsWith('file.') ? { type: 'file', url: params.file, name: params.name } : params;

        if (params.folder) {
          throw new ParamsError('抖音不支持文件夹参数');
        }
        const upload = await this.upload(account, mediaParams);

        if (!address) {
          return ok({ fileId: upload.fileId });
        }
        if (this.stopped) {
          throw new ParamsError('适配器已停止');
        }

        return [this.response(await client.sendMedia({ ...address, [upload.type]: upload.asset }), true)];
      }

      if (action === 'message.forward.user' || action === 'message.forward.channel') {
        if (!Array.isArray(params) || !params.length) {
          throw new ParamsError('转发节点不能为空');
        }
        const nodes = params.map(node => {
          if (
            !Array.isArray(node.content) ||
            !node.content.length ||
            node.content.some((item: Payload) => item.type !== 'Text' || typeof item.value !== 'string')
          ) {
            throw new ParamsError('框架合并转发目前仅支持文本节点');
          }

          return {
            uid: node.user_id ?? account.platformUid,
            nickname: node.nickname ?? account.config.name ?? account.platformUid,
            text: node.content.map((item: Payload) => item.value).join(''),
            msgType: 7,
            aweType: 700,
            msgId: '0',
            createTime: node.time
          };
        });

        const address = await this.address(account, payload);

        this.assertRunning();

        return [this.response(await client.sendMergeForward({ ...address, nodes, selfUid: account.platformUid }), true)];
      }

      if (['message.send', 'message.send.user', 'message.send.channel', 'message.send.target'].includes(action)) {
        const address = await this.address(account, payload);
        const format = Array.isArray(params.format)
          ? params.format.map(item => (item?.type === 'Markdown' ? { type: 'Text', value: markdownText(item.value) } : item))
          : params.format;

        if (!Array.isArray(format) || !format.length) {
          throw new ParamsError('format 不能为空');
        }
        // Validate all segments before sending the first one. Never silently drop content.
        const supported = new Set(['Text', 'MarkdownOriginal', 'Link', 'Mention', 'Image', 'ImageURL', 'ImageFile', 'Attachment']);

        for (const item of format) {
          if (!item || !supported.has(item.type)) {
            throw new ParamsError(`暂不支持 ${String(item?.type)} 消息段`);
          }
          if (item.type === 'Text' || item.type === 'MarkdownOriginal') {
            if (typeof item.value !== 'string') {
              throw new ParamsError('文本必须是字符串');
            }
          } else if (item.type !== 'Mention') {
            required(item.value, '消息段内容');
          }
          if (item.type === 'Link') {
            required(item.options?.link, '链接');
          }
          if (item.type === 'Mention' && item.options?.belong && item.options.belong !== 'user') {
            throw new ParamsError('不支持此提及类型');
          }
          if (item.type === 'Mention') {
            required(item.options?.payload?.UserId ?? item.value, '提及用户 ID');
          }
        }
        if (format.some(item => ['Image', 'ImageURL', 'ImageFile', 'Attachment'].includes(item.type))) {
          if (params.replyId) {
            throw new ParamsError('媒体组合消息暂不支持引用回复');
          }
          const prepared: Array<{ type: string; asset: any } | { format: Payload[] }> = [];
          let textItems: Payload[] = [];
          const flushText = () => {
            if (textItems.some(item => !['Text', 'MarkdownOriginal'].includes(item.type) || item.value.trim())) {
              prepared.push({ format: textItems });
            }
            textItems = [];
          };

          for (const item of format) {
            if (['Image', 'ImageURL', 'ImageFile', 'Attachment'].includes(item.type)) {
              flushText();
              prepared.push(
                await this.upload(account, {
                  type: item.type === 'Attachment' ? 'file' : 'image',
                  url: item.value,
                  name: item.options?.filename ?? 'attachment'
                })
              );
            } else {
              textItems.push(item);
            }
          }
          flushText();
          const results: ReturnType<typeof result>[] = [];

          for (const item of prepared) {
            if (this.stopped) {
              results.push(result(ResultCode.Fail, '适配器已停止'));
              break;
            }
            try {
              const sent =
                'format' in item
                  ? await this.handle(action, { ...payload, params: { format: item.format } })
                  : [this.response(await client.sendMedia({ ...address, [item.type]: item.asset }), true)];

              results.push(...sent);
              if (sent.some(value => value.code !== ResultCode.Ok)) {
                break;
              }
            } catch {
              results.push(result(ResultCode.FailInternal, '媒体发送失败；之前成功的消息不会回滚'));
              break;
            }
          }

          return results;
        }
        let text = '';
        const mentions: Array<{ uid: string; text: string; location: number; length: number }> = [];

        for (const item of format) {
          if (item.type === 'Text' || item.type === 'MarkdownOriginal') {
            text += item.value;
          } else if (item.type === 'Link') {
            text += `${item.value ?? ''} (${required(item.options?.link, '链接')})`;
          } else if (item.type === 'Mention') {
            if (item.options?.belong && item.options.belong !== 'user') {
              throw new ParamsError('不支持此提及类型');
            }
            const uid = required(item.options?.payload?.UserId ?? item.value, '提及用户 ID');
            const label = `@${item.value ?? uid}`;

            mentions.push({ uid, text: label, location: text.length, length: label.length });
            text += label;
          } else {
            throw new ParamsError(`暂不支持 ${String(item.type)} 消息段；请使用 SDK 媒体接口`);
          }
        }
        if (!text.trim()) {
          throw new ParamsError('消息不能为空');
        }
        if (params.replyId) {
          if (mentions.length) {
            throw new ParamsError('引用回复暂不支持同时提及');
          }
          const replyId = required(params.replyId, 'replyId');
          const cached = this.messages.get(`${account.platformUid}:${replyId}`);

          if (cached && cached.address.conversationId !== address.conversationId) {
            throw new ParamsError('引用消息不属于目标会话');
          }
          const referenced = cached?.message;
          const history = referenced ? undefined : await message.getMessage(client, address, replyId);

          this.assertRunning();

          return [
            this.response(
              await client.reply({
                ...address,
                text,
                referencedMessageId: replyId,
                referencedMessageType: referenced?.messageType ?? history.msgType,
                referencedUid: referenced?.senderUid ?? history.senderUid,
                referencedSecUid: referenced?.senderSecUid ?? history?.senderSecUid,
                referencedText: referenced?.text ?? parseMessageContent(history.content, history.msgType).text
              }),
              true
            )
          ];
        }

        this.assertRunning();

        return [this.response(await client.sendText(address, text, mentions), true)];
      }
      if (action === 'message.delete' || action === 'reaction.add' || action === 'reaction.remove') {
        const id = required(payload.MessageId, 'MessageId');
        const address = await this.address(account, payload);

        this.assertRunning();

        return [
          this.response(
            action === 'message.delete'
              ? await client.recall({ ...address, serverMessageId: id })
              : await client.modifyReaction({
                  ...address,
                  serverMessageId: id,
                  emoji: required(payload.EmojiId, 'EmojiId'),
                  operatorUid: account.platformUid,
                  enabled: action === 'reaction.add'
                })
          )
        ];
      }
      if (action === 'request.friend' || action === 'request.guild') {
        const flag = required(params.flag, 'flag');

        if (typeof params.approve !== 'boolean') {
          throw new ParamsError('approve 必须是布尔值');
        }
        if (params.remark || params.reason || (params.subType && params.subType !== 'add')) {
          throw new ParamsError('不支持该审核备注、原因或申请类型');
        }

        return [
          this.response(
            action === 'request.friend'
              ? await (params.approve ? client.approveFriend(flag) : client.rejectFriend(flag))
              : await (params.approve ? client.approveGroupJoin(flag) : client.rejectGroupJoin(flag))
          )
        ];
      }
      if (action === 'me.info') {
        return ok(this.user(account.platformUid, account.config.name));
      }
      if (action === 'mention.get') {
        const cached = this.messages.get(`${account.platformUid}:${required(payload.event?.MessageId, 'MessageId')}`);

        return ok(cached ? mentionIds(cached.message.content).map(uid => this.user(uid)) : []);
      }
      if (action === 'user.info') {
        const uid = required(payload.UserId, 'UserId');

        if (uid === account.platformUid) {
          return ok(this.user(uid, account.config.name));
        }
        const friend = (await client.getFriendList()).find(friend => friend.uid === uid);
        const stranger = friend ? undefined : (await client.getStrangerList()).find(peer => peer.uid === uid);
        const user = friend ?? stranger;

        if (!user) {
          throw new ParamsError('用户不在可访问会话中');
        }

        return ok(this.user(user.uid, user.nickname));
      }
      if (action === 'me.friends') {
        return ok((await client.getFriendList()).map(friend => this.user(friend.uid, friend.nickname)));
      }
      if (action === 'me.threads') {
        const peers = [...(await client.getFriendList()), ...(await client.getStrangerList())];

        return ok([
          ...new Map(
            peers.map(peer => [
              peer.conversationId,
              {
                ...this.user(peer.uid, peer.nickname),
                OpenId: peer.uid,
                ConversationId: peer.conversationId
              }
            ])
          ).values()
        ]);
      }
      if (action === 'guild.list' || action === 'me.guilds') {
        return ok(
          (await client.getGroupList()).map(group => ({
            GuildId: group.conversationId,
            GuildName: group.name,
            GuildIcon: group.avatar,
            GuildOwnerId: group.ownerUid,
            MemberCount: group.members.length
          }))
        );
      }
      if (action === 'guild.info' || action === 'channel.info' || action === 'channel.list') {
        const id = required(payload.GuildId ?? payload.ChannelId, '群 ID');
        const group = (await client.getGroupList()).find(group => group.conversationId === id || group.conversationShortId === id);

        if (!group) {
          throw new ParamsError('群不存在');
        }
        const channel = { ChannelId: group.conversationId, GuildId: group.conversationId, ChannelName: group.name };

        return ok(
          action === 'guild.info'
            ? { GuildId: group.conversationId, GuildName: group.name, GuildIcon: group.avatar, GuildOwnerId: group.ownerUid, MemberCount: group.members.length }
            : action === 'channel.list'
            ? [channel]
            : channel
        );
      }
      if (action === 'guild.update') {
        if (Object.keys(params).some(key => key !== 'name')) {
          throw new ParamsError('仅支持修改群名称');
        }

        const address = await this.address(account, { ChannelId: payload.GuildId });

        this.assertRunning();

        return [this.response(await client.setGroupName(address, required(params.name, '群名称')))];
      }
      if (action === 'member.info' || action === 'member.list' || action === 'member.search') {
        if (params.After || params.Before) {
          throw new ParamsError('群成员查询不支持游标');
        }
        const address = await this.address(account, { ChannelId: payload.GuildId ?? params.guildId ?? payload.event?.GuildId });
        let members = (await client.getGroupMembers(address)).map(member => ({
          ...this.user(member.uid, member.nickname, member.avatar),
          GuildId: address.conversationId,
          Nickname: member.alias,
          Roles: [String(member.role)]
        }));

        if (action === 'member.info') {
          const found = members.find(member => member.UserId === params.userId);

          if (!found) {
            throw new ParamsError('群成员不存在');
          }

          return ok(found);
        }
        if (action === 'member.search') {
          const keyword = required(params.keyword, 'keyword');

          members = members.filter(member => member.UserId.includes(keyword) || member.UserName?.includes(keyword) || member.Nickname?.includes(keyword));
        }
        const limit = params.Limit ?? params.limit ?? members.length;

        if (!Number.isInteger(limit) || limit < 0) {
          throw new ParamsError('limit 无效');
        }

        return ok({ Items: members.slice(0, limit), Total: members.length, HasMore: members.length > limit });
      }
      if (action === 'message.get') {
        const cached = this.messages.get(`${account.platformUid}:${required(payload.MessageId, 'MessageId')}`);

        if (!cached) {
          throw new ParamsError('未知消息上下文，无法安全定位会话');
        }

        return ok({ MessageId: cached.message.serverMessageId, MessageText: cached.message.text, UserId: cached.message.senderUid });
      }
      if (action === 'history.list') {
        if (params.after) {
          throw new ParamsError('抖音历史接口仅支持向前查询');
        }
        const limit = params.limit ?? 20;

        if (!Number.isInteger(limit) || limit < 1 || limit > 60) {
          throw new ParamsError('limit 必须在 1 到 60 之间');
        }
        const address = await this.address(account, payload);
        const history = await message.getHistory(client, address, { count: limit, messageId: params.before });

        return ok(
          history.map(row => ({
            MessageId: row.msgId,
            MessageText: parseMessageContent(row.content, row.msgType).text,
            UserId: row.senderUid,
            ChannelId: address.conversationId
          }))
        );
      }

      return [result(ResultCode.Fail, `douyin 不支持动作 ${action}`)];
    } catch (error) {
      return [
        result(
          error instanceof ParamsError ? ResultCode.FailParams : ResultCode.FailInternal,
          error instanceof ParamsError ? error.message : '抖音操作失败；请检查账号状态及会话权限'
        )
      ];
    }
  }
}
