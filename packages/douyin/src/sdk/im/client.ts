// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
import type { DouyinHttp } from '../http/client.js';
import { logger } from '../logger.js';
import { AndroidFrontierWs } from './protocol/index.js';
import { decodeWireTree } from './protocol/index.js';
import type { WsCloseEvent, WsReconnectEvent, AndroidFrontierWsOptions } from './protocol/index.js';
import { ImProtoTransport } from './transport.js';
import { toInboundMessage, extractAndroidPushes, extractReactions } from './receiver.js';
import { extractAndroidNotices, noticeFromPush } from './notifications.js';
import { ImMediaUploader } from './upload.js';
import type { VideoAsset, FileUploadAsset } from './upload.js';
import * as inbox from './inbox.js';
import * as send from './send.js';
import type {
  ActionResult,
  ChatMessage,
  ConversationAddress,
  FriendInfo,
  FriendRequestInfo,
  GroupInfo,
  GroupJoinRequestInfo,
  GroupMemberInfo,
  InboundMessage,
  ModifyReactionItem,
  NoticeEvent,
  RecallItem,
  RecallResult,
  RequestEvent,
  SendMessageResponse,
  StrangerInfo
} from './types.js';
import { FriendRequestStatus, GroupJoinRequestStatus } from './types.js';
import type { ImageAsset, FileAssetPayload, TextMention } from './content.js';

export interface ImClientOptions {
  http: DouyinHttp;
  /** 当前账号数字 uid（Android frontier device_id + 自发消息过滤） */
  userId: string;
  /** 浏览器复制的 Cookie 串（WS 握手用；HTTP 通道使用 http 实例内的 Cookie） */
  cookies: string;
  /** Desktop IM 设备 ID（收件箱 Cookie 查询/动作通道用） */
  deviceId?: string;
  /** Optional WebSocket transport injection. */
  webSocketFactory?: AndroidFrontierWsOptions['webSocketFactory'];
}

export type ImClientEventMap = {
  ready: [];
  message: [message: InboundMessage];
  notice: [notice: NoticeEvent];
  request: [request: RequestEvent];
  reconnecting: [event: WsReconnectEvent];
  close: [event: WsCloseEvent];
  error: [error: Error];
};

export type ImClientEvent = keyof ImClientEventMap;

type EventListener<T extends ImClientEvent> = (...args: ImClientEventMap[T]) => void;

export interface SendMediaItem extends ConversationAddress {
  /** 图片（uploadImage 结果）或视频（uploadVideo 结果 + 尺寸）或文件（uploadFile 结果）三选一 */
  image?: ImageAsset;
  video?: {
    asset: VideoAsset;
    poster: ImageAsset;
    width: number;
    height: number;
    checkPics?: string[];
  };
  file?: FileAssetPayload;
}

/**
 * IM 消息业务门面：收消息走 Android Frontier WS 推送，
 * 发消息统一 HTTP cookie 通道（native ImOption profile，cmd=100），
 * HTTP 同时承担收件箱查询/动作与媒体上传。方法直接转发到各模块。
 */
export class ImClient {
  private readonly http: DouyinHttp;
  private readonly userId: string;
  private readonly deviceId: string;
  private readonly transport: ImProtoTransport;
  private readonly uploader: ImMediaUploader;
  private readonly inboxCtx: inbox.InboxContext;
  /** Android Frontier 长连接：接收推送 */
  private readonly ws: AndroidFrontierWs;
  private readonly handlers = new Map<ImClientEvent, Set<(...args: any[]) => void>>();

  constructor(options: ImClientOptions) {
    this.http = options.http;
    this.http.jar.merge(options.cookies);
    this.userId = options.userId;
    this.deviceId = options.deviceId ?? options.http.deviceId;
    this.transport = new ImProtoTransport(this.http);
    this.uploader = new ImMediaUploader(this.http, () => Promise.resolve(this.userId));
    this.ws = new AndroidFrontierWs({
      userId: options.userId,
      cookies: options.cookies,
      getCookies: () => options.http.getCookies() || options.cookies,
      webSocketFactory: options.webSocketFactory,
      callbacks: {
        onOpen: () => this.emit('ready'),
        onMessage: bytes => this.handleFrame(bytes),
        onReconnecting: event => this.emit('reconnecting', event),
        onClose: event => this.emit('close', event),
        onError: error => this.emit('error', error)
      }
    });
    this.inboxCtx = {
      transport: this.transport,
      deviceId: this.deviceId,
      platformUid: options.userId
    };
  }

  /* -- 接收 + 发送（均为 Android Frontier WS） ---------------------------- */

  /** 连接 Android Frontier WS 长连接并开始接收群聊/私聊消息 */
  async start(): Promise<void> {
    if (this.ws.connected) {
      return;
    }
    await this.ws.connect();
  }

  get connected(): boolean {
    return this.ws.connected;
  }

  /** 停止接收并关闭连接 */
  stop(): void {
    this.ws.close();
  }

  /** 事件注册：message / notice / request / reconnecting / close（start 前注册同样生效） */
  on<T extends ImClientEvent>(event: T, callback: EventListener<T>): void {
    let set = this.handlers.get(event);

    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(callback as (...args: any[]) => void);
  }

  off<T extends ImClientEvent>(event: T, callback: EventListener<T>): void {
    this.handlers.get(event)?.delete(callback as (...args: any[]) => void);
  }

  private emit<T extends ImClientEvent>(event: T, ...args: ImClientEventMap[T]): void {
    for (const handler of this.handlers.get(event) ?? []) {
      (handler as EventListener<T>)(...args);
    }
  }

  /** Android Frontier 帧分发：原生通知/请求 + 消息推送（过滤自发，命令消息分流为 notice/request） */
  private handleFrame(bytes: Uint8Array): void {
    for (const notice of extractAndroidNotices(bytes)) {
      if (notice.type === 'friend.request' || notice.type === 'group.join-request') {
        this.emit('request', notice);
      } else {
        this.emit('notice', notice);
      }
    }
    const pushes = extractAndroidPushes(bytes);
    let emitted = 0;

    for (const reaction of extractReactions(bytes)) {
      this.emit('notice', reaction);
      emitted++;
    }
    for (const push of pushes) {
      if (push.senderUid === this.userId) {
        continue;
      }
      const event = noticeFromPush(push);

      if (event) {
        if (event.type === 'friend.request' || event.type === 'group.join-request') {
          this.emit('request', event);
        } else {
          this.emit('notice', event);
        }
        emitted++;
        continue;
      }
      // Route commands and requests first; only discard unhandled signaling.
      if (push.messageType >= 50000) {
        continue;
      }
      this.emit('message', toInboundMessage(push));
      emitted++;
    }
    // 无产出推送帧诊断：property 帧（含 f500）打印完整子树，其余打印概要
    if (emitted === 0) {
      const wire = JSON.stringify(decodeWireTree(bytes));
      const len = wire.includes('"f":500') ? 3800 : 0;

      if (len && /0:\d+:\d+:\d+/.test(wire)) {
        logger.debug(`[douyin:im] property帧无产出 ${bytes.length}B wire=${wire.slice(0, len)}`);
      }
    }
  }

  /* -- 发送 ------------------------------------------------------------- */

  /**
   * 发送全部走 Android Frontier WS cmd=100 直发
   * （ext 携带 s:send_ignore_ticket=true，无需会话 ticket 与设备真值）。
   */

  async sendText(address: ConversationAddress, text: string, mentions?: TextMention[]): Promise<SendMessageResponse> {
    return await send.sendText(this.sendCtx(), address, text, mentions);
  }

  /** 合并转发（messageType=136） */
  async sendMergeForward(options: send.SendForwardOptions): Promise<SendMessageResponse> {
    return await send.sendMergeForward(this.sendCtx(), options);
  }

  /** 发送图片/视频/文件（媒体需先 uploadImage/uploadVideo/uploadFile） */
  async sendMedia(item: SendMediaItem): Promise<SendMessageResponse> {
    const ctx = this.sendCtx();

    if (item.image) {
      return await send.sendImage(ctx, { ...item, image: item.image });
    }
    if (item.video) {
      const { asset, poster, width, height, checkPics } = item.video;

      return await send.sendVideo(ctx, {
        ...item,
        video: { tkey: asset.tkey, skey: asset.skey, md5: asset.md5, poster, width, height, ...(checkPics ? { checkPics } : {}) }
      });
    }
    if (item.file) {
      return await send.sendFile(ctx, { ...item, file: item.file });
    }

    return await Promise.reject(new Error('sendMedia requires image, video or file'));
  }

  async reply(options: send.ReplyOptions): Promise<SendMessageResponse> {
    return await send.reply(this.sendCtx(), options);
  }

  recall(item: RecallItem): Promise<RecallResult> {
    return inbox.recall(this.inboxCtx, this.deviceId, item);
  }

  /** 消息表情回应（cmd=705 set_property，emoji 为抖音 skey 文本键） */
  modifyReaction(item: ModifyReactionItem): Promise<{ statusCode: number; statusMsg: string }> {
    return inbox.modifyReaction(this.inboxCtx, this.deviceId, item);
  }

  /* -- 上传 ------------------------------------------------------------- */

  uploadImage(data: Uint8Array): Promise<ImageAsset> {
    return this.uploader.uploadImage(data);
  }

  uploadVideo(data: Uint8Array): Promise<VideoAsset> {
    return this.uploader.uploadVideo(data);
  }

  uploadFile(data: Uint8Array, name: string): Promise<FileUploadAsset> {
    return this.uploader.uploadFile(data, name);
  }

  /* -- 收件箱 / 联系人 ---------------------------------------------------- */

  getFriendList(options: inbox.InboxListOptions = {}): Promise<FriendInfo[]> {
    return inbox.getFriendList(this.inboxCtx, this.deviceId, options);
  }

  getGroupList(options: inbox.InboxListOptions = {}): Promise<GroupInfo[]> {
    return inbox.getGroupList(this.inboxCtx, this.deviceId, options);
  }

  getGroupMembers(address: ConversationAddress): Promise<GroupMemberInfo[]> {
    return inbox.getGroupMembers(this.inboxCtx, this.deviceId, address);
  }

  getStrangerList(options: inbox.InboxListOptions = {}): Promise<StrangerInfo[]> {
    return inbox.getStrangerList(this.inboxCtx, options);
  }

  getChatHistory(address: ConversationAddress & { cursor?: string | number; count?: number }): Promise<ChatMessage[]> {
    return inbox.getChatHistory(this.inboxCtx, this.deviceId, address);
  }

  getFriendRequests(options: { status?: FriendRequestStatus } = {}): Promise<FriendRequestInfo[]> {
    return inbox.getFriendRequests(this.inboxCtx, this.deviceId, options);
  }

  getGroupJoinRequests(options: { conversationShortId?: string } = {}): Promise<GroupJoinRequestInfo[]> {
    return inbox.getGroupJoinRequests(this.inboxCtx, this.deviceId, options);
  }

  /* -- 申请审批 ----------------------------------------------------------- */

  approveFriend(applicantUid: string): Promise<ActionResult> {
    return inbox.reviewFriendRequest(this.inboxCtx, this.deviceId, applicantUid, FriendRequestStatus.APPROVED);
  }

  rejectFriend(applicantUid: string): Promise<ActionResult> {
    return inbox.reviewFriendRequest(this.inboxCtx, this.deviceId, applicantUid, FriendRequestStatus.REJECTED);
  }

  approveGroupJoin(requestId: string): Promise<ActionResult & { request?: GroupJoinRequestInfo }> {
    return inbox.reviewGroupJoinRequest(this.inboxCtx, this.deviceId, requestId, GroupJoinRequestStatus.APPROVED);
  }

  rejectGroupJoin(requestId: string): Promise<ActionResult & { request?: GroupJoinRequestInfo }> {
    return inbox.reviewGroupJoinRequest(this.inboxCtx, this.deviceId, requestId, GroupJoinRequestStatus.REJECTED);
  }

  /** 设置群名（cmd=902） */
  setGroupName(address: ConversationAddress, name: string): Promise<ActionResult> {
    return inbox.setGroupName(this.inboxCtx, this.deviceId, address, name);
  }

  /** 统一发送上下文：HTTP cookie 通道（native ImOption profile） */
  private sendCtx(): send.SendContext {
    return { transport: this.transport, deviceId: this.deviceId };
  }
}
