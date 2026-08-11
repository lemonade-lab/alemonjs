import axios, { type AxiosRequestConfig } from 'axios';
import { ApiRequestData, FileType, GroupAction, SetMemberMuteState, StreamMessageData, UploadPartFinishData, UploadPrepareData } from './typing.js';
import { QQBotConfig } from './config.js';
import FormData from 'form-data';
import { createPicFrom } from 'alemonjs/utils';
import { createAxiosInstance } from './instance.js';
import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { chunkedUpload, CHUNK_THRESHOLD, fileDataToBuffer } from '../upload.js';

/** 获取访问凭证域名（统一为 api.bot.qq.com，同接口调用域名） */
export const BOTS_API_RUL = 'https://api.bot.qq.com';
export const API_URL_SANDBOX = 'https://sandbox.api.sgroup.qq.com';
/** 接口调用域名 */
export const API_URL = 'https://api.bot.qq.com';

export type QQBotConnectionState = 'idle' | 'connecting' | 'ready' | 'reconnecting' | 'offline' | 'stopped';
export type QQBotConnectionStatus = {
  state: QQBotConnectionState;
  transport: 'websocket' | 'webhook' | 'proxy' | null;
  reconnectAttempts: number;
  heartbeatAcknowledged: boolean;
  sessionId?: string;
  sequence?: number;
  resumed: boolean;
  lastError?: string;
};

export type QQBotMediaHashes = {
  sha256: string;
  md5: string;
  sha1: string;
  md5_10m: string;
};

type QQBotStream = {
  userOpenId: string;
  msgId: string;
  eventId: string;
  msgSeq: number;
  index: number;
  streamMessageId?: string;
  lastSentAt: number;
  lastSentText: string;
  timer?: NodeJS.Timeout;
  latest?: string;
  sendTask?: Promise<unknown>;
};

export class QQBotAPI {
  protected readonly config: QQBotConfig;

  #msgMap = new Map<string, number>();

  #streams = new Map<string, QQBotStream>();
  #onStreamClosed?: (streamId: string) => void;
  #connectionStatus: QQBotConnectionStatus = {
    state: 'idle',
    transport: null,
    reconnectAttempts: 0,
    heartbeatAcknowledged: false,
    resumed: false
  };

  constructor(options: Record<string, unknown> = {}) {
    this.config = new QQBotConfig(options);
  }

  /** Read-only runtime snapshot, available through useClient<API>(). */
  getConnectionStatus(): QQBotConnectionStatus {
    return { ...this.#connectionStatus };
  }

  protected updateConnectionStatus(patch: Partial<QQBotConnectionStatus>) {
    this.#connectionStatus = { ...this.#connectionStatus, ...patch };
  }

  /** Internal transport hook used by the multi-bot registry to discard stale routes. */
  setStreamLifecycleListener(listener?: (streamId: string) => void) {
    this.#onStreamClosed = listener;
  }

  /** C2C-only input indicator. This is intentionally a QQ extension, not a core action. */
  sendTyping(params: { BotId?: string; userOpenId: string; msgId?: string; durationSec?: number }) {
    if (!params.userOpenId) throw new Error('userOpenId is required');

    return this.groupService({
      url: `/v2/users/${params.userOpenId}/input_notify`,
      method: 'post',
      data: {
        ...(params.msgId && { msg_id: params.msgId }),
        input_second: Math.max(1, Math.min(Number(params.durationSec) || 30, 60))
      }
    });
  }

  streamOpen(params: { BotId?: string; userOpenId: string; msgId: string; eventId?: string }) {
    if (!params.userOpenId || !params.msgId) throw new Error('C2C streaming requires userOpenId and msgId');
    const streamId = randomUUID();
    const stream: QQBotStream = {
      userOpenId: params.userOpenId,
      msgId: params.msgId,
      eventId: params.eventId || params.msgId,
      msgSeq: this.getMessageSeq(params.msgId),
      index: 0,
      lastSentAt: 0,
      lastSentText: ''
    };

    stream.timer = setTimeout(() => this.streamCancel(streamId), 5 * 60 * 1000);
    this.#streams.set(streamId, stream);

    return { streamId };
  }

  async streamUpdate(streamId: string, fullText: string) {
    const stream = this.#streams.get(streamId);
    if (!stream) throw new Error('Unknown or expired streamId');
    stream.latest = fullText;
    if (!stream.sendTask) {
      stream.sendTask = (async () => {
        let result: unknown;
        while (stream.latest !== undefined && this.#streams.get(streamId) === stream) {
          const content = stream.latest;
          stream.latest = undefined;
          // QQ accepts at most a practical update rate.  500ms is the default,
          // and the API contract never permits callers below 300ms.
          const wait = Math.max(0, 500 - (Date.now() - stream.lastSentAt));
          if (wait) await new Promise(resolve => setTimeout(resolve, wait));
          // The stream may have timed out or its gateway may have stopped
          // while the rate limiter was waiting. Never emit a trailing packet.
          if (this.#streams.get(streamId) !== stream) break;
          stream.lastSentAt = Date.now();
          const response: { id?: string } = await this.groupService({
            url: `/v2/users/${stream.userOpenId}/stream_messages`,
            method: 'post',
            data: {
              msg_id: stream.msgId,
              event_id: stream.eventId,
              msg_seq: stream.msgSeq,
              index: stream.index++,
              input_mode: 'replace',
              input_state: 1,
              content_type: 'markdown',
              content_raw: content,
              ...(stream.streamMessageId && { stream_msg_id: stream.streamMessageId })
            }
          });
          if (response?.id && !stream.streamMessageId) stream.streamMessageId = response.id;
          stream.lastSentText = content;
          result = response;
        }
        return result;
      })().finally(() => {
        if (this.#streams.get(streamId) === stream) stream.sendTask = undefined;
      });
    }

    return stream.sendTask;
  }

  async streamComplete(streamId: string) {
    const stream = this.#streams.get(streamId);
    if (!stream) throw new Error('Unknown or expired streamId');
    try {
      await stream.sendTask;
      return await this.groupService({
        url: `/v2/users/${stream.userOpenId}/stream_messages`,
        method: 'post',
        data: {
          msg_id: stream.msgId,
          event_id: stream.eventId,
          msg_seq: stream.msgSeq,
          index: stream.index++,
          input_mode: 'replace',
          input_state: 10,
          content_type: 'markdown',
          content_raw: stream.latest ?? stream.lastSentText,
          ...(stream.streamMessageId && { stream_msg_id: stream.streamMessageId })
        }
      });
    } finally {
      this.streamCancel(streamId);
    }
  }

  streamCancel(streamId: string) {
    const stream = this.#streams.get(streamId);
    if (stream?.timer) clearTimeout(stream.timer);
    if (this.#streams.delete(streamId)) this.#onStreamClosed?.(streamId);
  }

  /** Called by transports during shutdown so C2C streams cannot leak timers. */
  protected cancelStreams() {
    for (const streamId of this.#streams.keys()) this.streamCancel(streamId);
  }

  // /\[🔗[^\]]+\]\([^)]+\)|@everyone/.test(content)

  /**
   * 得到鉴权
   * @param app_id
   * @param clientSecret
   * @returns
   */
  getAuthentication() {
    const app_id = this.config.get('app_id');
    const secret = this.config.get('secret');

    const baseUrlAppAccessToken = this.config.get('base_url_app_access_token');

    const params: {
      baseURL?: string;
      url: string;
    } = {
      url: '/app/getAppAccessToken'
    };

    if (baseUrlAppAccessToken) {
      params.baseURL = baseUrlAppAccessToken;
    }

    const service = axios.create({
      baseURL: BOTS_API_RUL,
      timeout: 20000
    });

    return createAxiosInstance(service, {
      ...params,
      method: 'post',
      data: {
        appId: `${app_id}`,
        clientSecret: `${secret}`
      }
    });
  }

  /**
   * 统一鉴权请求（QQBot AccessToken）
   * @param options
   * @returns
   */
  groupService(options: AxiosRequestConfig) {
    const app_id = this.config.get('app_id');
    const token = this.config.get('access_token');
    const sandbox = this.config.get('sandbox');
    const service = axios.create({
      baseURL: sandbox ? API_URL_SANDBOX : API_URL,
      timeout: 20000,
      headers: {
        'X-Union-Appid': app_id,
        Authorization: `QQBot ${token}`
      }
    });

    return createAxiosInstance(service, options);
  }

  /**
   * @deprecated 使用 groupService 代替，鉴权方式已统一
   */
  guildServer(options: AxiosRequestConfig) {
    return this.groupService(options);
  }

  /**
   * 得到鉴权
   * @returns
   */
  gateway() {
    const baseUrlGateway = this.config.get('base_url_gateway');

    const params: {
      baseURL?: string;
      url: string;
    } = {
      url: '/gateway'
    };

    if (baseUrlGateway) {
      params.baseURL = baseUrlGateway;
    }

    return this.groupService(params);
  }

  /**
   * 发送私聊消息
   * @param openid
   * @param content
   * @param msg_id
   * @returns
   *   0 文本  1 图文 2 md 3 ark 4 embed
   */
  usersOpenMessages(openid: string, data: ApiRequestData): Promise<{ id: string; timestamp: number }> {
    const db = {
      ...(data.event_id
        ? { event_id: data.event_id }
        : {
            msg_seq: this.getMessageSeq(data.msg_id || '')
          }),
      ...data
    };

    return this.groupService({
      url: `/v2/users/${openid}/messages`,
      method: 'post',
      data: db
    });
  }

  /**
   * 得到消息序列
   * @param MessageId
   * @returns
   */
  getMessageSeq(MessageId: string): number {
    let seq = this.#msgMap.get(MessageId) || 0;

    seq++;
    this.#msgMap.set(MessageId, seq);
    // 如果映射表大小超过 100，则删除最早添加的 MessageId
    if (this.#msgMap.size > 100) {
      const firstKey = this.#msgMap.keys().next().value;

      if (firstKey) {
        this.#msgMap.delete(firstKey);
      }
    }

    return seq;
  }

  /**
   * 发送群聊消息
   * @param group_openid
   * @param data
   * @returns
   */
  groupOpenMessages(group_openid: string, data: ApiRequestData): Promise<{ id: string; timestamp: number }> {
    const db = {
      ...(data.event_id
        ? { event_id: data.event_id }
        : {
            msg_seq: this.getMessageSeq(data.msg_id || '')
          }),
      ...data
    };

    return this.groupService({
      url: `/v2/groups/${group_openid}/messages`,
      method: 'post',
      data: db
    });
  }

  /**
   * 发送私聊富媒体文件
   * @param openid
   * @param data
   * @returns
   *  1 图文 2 视频 3 语言 4 文件
   * 图片：png/jpg，视频：mp4，语音：silk
   */
  postRichMediaByUser(
    openid: string,
    data: {
      srv_send_msg?: boolean;
      file_type: FileType;
      url?: string;
      file_data?: any;
      upload_id?: string;
      file_name?: string;
    }
  ): Promise<{ file_uuid: string; file_info: string; ttl: number; id?: string; raw_url?: string }> {
    // 大文件（> 10002432 字节）自动切换为分片上传
    const fileBuffer = fileDataToBuffer(data.file_data);
    if (!data.upload_id && fileBuffer && fileBuffer.byteLength > CHUNK_THRESHOLD) {
      return chunkedUpload(this, 'user', openid, fileBuffer, { file_type: data.file_type, file_name: data.file_name, srv_send_msg: data.srv_send_msg });
    }
    return this.groupService({
      url: `/v2/users/${openid}/files`,
      method: 'post',
      data: data
    });
  }

  /**
   * 发送群里文件
   * @param openid
   * @param data
   * @returns
   *  1 图文 2 视频 3 语言 4 文件
   * 图片：png/jpg，视频：mp4，语音：silk
   */
  postRichMediaByGroup(
    openid: string,
    data: {
      srv_send_msg?: boolean;
      file_type: FileType;
      url?: string;
      file_data?: any;
      upload_id?: string;
      file_name?: string;
    }
  ): Promise<{ file_uuid: string; file_info: string; ttl: number; id?: string; raw_url?: string }> {
    // 大文件（> 10002432 字节）自动切换为分片上传
    const fileBuffer = fileDataToBuffer(data.file_data);
    if (!data.upload_id && fileBuffer && fileBuffer.byteLength > CHUNK_THRESHOLD) {
      return chunkedUpload(this, 'group', openid, fileBuffer, { file_type: data.file_type, file_name: data.file_name, srv_send_msg: data.srv_send_msg });
    }
    return this.groupService({
      url: `/v2/groups/${openid}/files`,
      method: 'post',
      data: {
        srv_send_msg: false,
        ...data
      }
    });
  }

  /** Produces upload and cache hashes without materialising the file in memory. */
  async getMediaFileHashes(filePath: string): Promise<QQBotMediaHashes> {
    const sha256 = createHash('sha256');
    const md5 = createHash('md5');
    const sha1 = createHash('sha1');
    const md5_10m = createHash('md5');
    let firstBytes = 0;
    const firstLimit = 10_002_432;

    for await (const chunk of createReadStream(filePath)) {
      const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      sha256.update(data);
      md5.update(data);
      sha1.update(data);
      if (firstBytes < firstLimit) {
        const length = Math.min(data.length, firstLimit - firstBytes);
        md5_10m.update(data.subarray(0, length));
        firstBytes += length;
      }
    }

    return {
      sha256: sha256.digest('hex'),
      md5: md5.digest('hex'),
      sha1: sha1.digest('hex'),
      md5_10m: md5_10m.digest('hex')
    };
  }

  /**
   * QQ's large-file protocol: prepare -> COS PUT -> part finish -> complete.
   * A local path is read one part at a time, including retry attempts.
   */
  async postChunkedRichMedia(params: {
    scope: 'group' | 'c2c';
    targetId: string;
    fileType: FileType;
    data?: Buffer;
    filePath?: string;
    size?: number;
    hashes?: QQBotMediaHashes;
    name?: string;
    onProgress?: (uploaded: number, total: number) => void;
  }): Promise<{ file_uuid: string; file_info: string; ttl: number }> {
    const hasBuffer = Buffer.isBuffer(params.data);
    const hasFile = Boolean(params.filePath);
    if (hasBuffer === hasFile) throw new Error('Chunked media requires exactly one of data or filePath');
    const total = hasBuffer ? params.data!.length : Number(params.size);
    if (!Number.isSafeInteger(total) || total < 1) throw new Error('Chunked media requires a valid file size');
    const hashes = params.hashes || (hasBuffer ? this.#getMediaBufferHashes(params.data!) : await this.getMediaFileHashes(params.filePath!));
    const prefix = params.scope === 'group' ? `/v2/groups/${params.targetId}` : `/v2/users/${params.targetId}`;
    const prepared: {
      upload_id: string;
      block_size: number;
      parts: Array<{ index: number; presigned_url: string }>;
    } = await this.groupService({
      url: `${prefix}/upload_prepare`,
      method: 'post',
      data: {
        file_type: params.fileType,
        file_name: params.name || 'file',
        file_size: total,
        md5: hashes.md5,
        sha1: hashes.sha1,
        md5_10m: hashes.md5_10m
      }
    });
    let uploaded = 0;
    for (const part of prepared.parts || []) {
      const offset = (part.index - 1) * prepared.block_size;
      const length = Math.min(prepared.block_size, total - offset);
      if (length <= 0) throw new Error(`QQ returned invalid upload part index: ${part.index}`);
      const body = hasBuffer ? params.data!.subarray(offset, offset + length) : undefined;
      const partMd5 = body ? createHash('md5').update(body).digest('hex') : await this.#getFilePartHash(params.filePath!, offset, length);
      await this.#retry(() =>
        axios.put(part.presigned_url, body || createReadStream(params.filePath!, { start: offset, end: offset + length - 1 }), {
          timeout: 300_000,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          headers: { 'Content-Length': String(length) }
        })
      );
      await this.#retry(() =>
        this.groupService({
          url: `${prefix}/upload_part_finish`,
          method: 'post',
          data: { upload_id: prepared.upload_id, part_index: part.index, block_size: length, md5: partMd5 }
        })
      );
      uploaded += length;
      params.onProgress?.(uploaded, total);
    }
    return this.#retry(() =>
      this.groupService({
        url: `${prefix}/complete_upload`,
        method: 'post',
        data: { upload_id: prepared.upload_id }
      })
    );
  }

  #getMediaBufferHashes(data: Buffer): QQBotMediaHashes {
    return {
      sha256: createHash('sha256').update(data).digest('hex'),
      md5: createHash('md5').update(data).digest('hex'),
      sha1: createHash('sha1').update(data).digest('hex'),
      md5_10m: createHash('md5').update(data.subarray(0, 10_002_432)).digest('hex')
    };
  }

  async #getFilePartHash(filePath: string, start: number, length: number) {
    const md5 = createHash('md5');
    for await (const chunk of createReadStream(filePath, { start, end: start + length - 1 })) md5.update(chunk);
    return md5.digest('hex');
  }

  async #retry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt + 1 < attempts) await new Promise(resolve => setTimeout(resolve, 250 * 2 ** attempt));
      }
    }
    throw lastError;
  }

  /**
   *
   * @param openid
   * @param message_id
   * @returns
   */
  userMessageDelete(openid: string, message_id: string) {
    return this.groupService({
      url: `/v2/users/${openid}/messages/${message_id}`,
      method: 'delete'
    });
  }

  /**
   * 群聊-撤回消息
   * @param group_openid 群 OpenID
   * @param message_id 消息 ID
   */
  groupMessageDelete(group_openid: string, message_id: string) {
    return this.groupService({
      url: `/v2/groups/${group_openid}/messages/${message_id}`,
      method: 'delete'
    });
  }

  /**
   * @deprecated 方法名拼写错误，请使用 groupMessageDelete 代替
   * @param group_openid 群 OpenID
   * @param message_id 消息 ID
   */
  grouMessageDelte(group_openid: string, message_id: string) {
    return this.groupMessageDelete(group_openid, message_id);
  }

  // ─── 群管理 ───

  /**
   * 获取群基本信息
   * @param group_openid 群 OpenID
   */
  groupsInfo(group_openid: string) {
    return this.groupService({
      url: `/v2/groups/${group_openid}/info`,
      method: 'get'
    });
  }

  /**
   * 获取机器人群内状态
   * @param group_openid 群 OpenID
   */
  groupsBotState(group_openid: string) {
    return this.groupService({
      url: `/v2/groups/${group_openid}/bot_state`,
      method: 'get'
    });
  }

  /**
   * 获取群成员详情
   * @param group_openid 群 OpenID
   * @param member_openid 群成员的 openid
   */
  groupsMembersMessage(group_openid: string, member_openid: string) {
    return this.groupService({
      url: `/v2/groups/${group_openid}/members/${member_openid}`,
      method: 'get'
    });
  }

  /**
   * 拉取入群申请列表
   * @param group_openid 群 OpenID
   * @param params 分页参数
   */
  groupsJoinRequestList(group_openid: string, params?: { cursor?: string; limit?: number }) {
    return this.groupService({
      url: `/v2/groups/${group_openid}/join_request_list`,
      method: 'get',
      params
    });
  }

  /**
   * 审批入群申请
   * @param group_openid 群 OpenID
   * @param member_openid 成员 OpenID
   * @param data 审批参数
   */
  groupsApprovalJoinRequest(
    group_openid: string,
    member_openid: string,
    data: { op: 'approve' | 'decline'; join_request_id?: string; reject_reason?: string; add_to_member_blacklist?: boolean }
  ) {
    return this.groupService({
      url: `/v2/groups/${group_openid}/approval_join_request/${member_openid}`,
      method: 'post',
      data
    });
  }

  /**
   * 查询群禁言状态
   * @param group_openid 群 OpenID
   */
  groupsRestrictChatSetting(group_openid: string) {
    return this.groupService({
      url: `/v2/groups/${group_openid}/restrict_chat_setting`,
      method: 'get'
    });
  }

  /**
   * 设置群成员禁言
   * @param group_openid 群 OpenID
   * @param data 禁言设置
   */
  groupsRestrictChatSettingPost(group_openid: string, data: { members?: SetMemberMuteState[] }) {
    return this.groupService({
      url: `/v2/groups/${group_openid}/restrict_chat_setting`,
      method: 'post',
      data
    });
  }

  /**
   * 查询入群自动审批策略列表
   * @param params 分页参数
   */
  groupsJoinApprovalStrategies(params?: { cursor?: string; limit?: number }) {
    return this.groupService({
      url: '/v2/groups/join_approval_strategy',
      method: 'get',
      params
    });
  }

  /**
   * 创建入群自动审批策略
   * @param data 策略参数
   */
  groupsJoinApprovalStrategyCreate(data: { group_openids?: string[]; group_ids?: string[]; is_enable?: 'on' | 'off'; expire_at?: string; remark?: string }) {
    return this.groupService({
      url: '/v2/groups/join_approval_strategy',
      method: 'post',
      data
    });
  }

  /**
   * 修改入群自动审批策略
   * @param strategy_id 策略 ID
   * @param data 修改参数
   */
  groupsJoinApprovalStrategyPatch(strategy_id: string, data: { is_enable?: 'on' | 'off'; expire_at?: string; group_action?: GroupAction; remark?: string }) {
    return this.groupService({
      url: `/v2/groups/join_approval_strategy/${strategy_id}`,
      method: 'patch',
      data
    });
  }

  /**
   * 删除入群自动审批策略
   * @param strategy_id 策略 ID
   */
  groupsJoinApprovalStrategyDelete(strategy_id: string) {
    return this.groupService({
      url: `/v2/groups/join_approval_strategy/${strategy_id}`,
      method: 'delete'
    });
  }

  /**
   * 执行入群自动审批策略
   * @param strategy_id 策略 ID
   */
  groupsJoinApprovalStrategyExecute(strategy_id: string) {
    return this.groupService({
      url: `/v2/groups/join_approval_strategy/${strategy_id}/execute`,
      method: 'post'
    });
  }

  /**
   * 修改入群自动审批策略白名单
   * @param strategy_id 策略 ID
   * @param data 白名单参数
   */
  groupsJoinApprovalStrategyWhitelistUsers(strategy_id: string, data: { op: 'add' | 'del'; whitelist_users: string[] }) {
    return this.groupService({
      url: `/v2/groups/join_approval_strategy/${strategy_id}/whitelist_users`,
      method: 'post',
      data
    });
  }

  // ─── 分片上传 / 流式消息 ───

  /**
   * 单聊-分片上传准备
   * @param userId 用户 OpenID
   * @param data 上传准备参数
   */
  usersUploadPrepare(userId: string, data: UploadPrepareData) {
    return this.groupService({
      url: `/v2/users/${userId}/upload_prepare`,
      method: 'post',
      data
    });
  }

  /**
   * 群聊-分片上传准备
   * @param groupId 群 OpenID
   * @param data 上传准备参数
   */
  groupUploadPrepare(groupId: string, data: UploadPrepareData) {
    return this.groupService({
      url: `/v2/groups/${groupId}/upload_prepare`,
      method: 'post',
      data
    });
  }

  /**
   * 单聊-分片完成
   * @param userId 用户 OpenID
   * @param data 分片完成参数
   */
  usersUploadPartFinish(userId: string, data: UploadPartFinishData) {
    return this.groupService({
      url: `/v2/users/${userId}/upload_part_finish`,
      method: 'post',
      data
    });
  }

  /**
   * 群聊-分片完成
   * @param groupId 群 OpenID
   * @param data 分片完成参数
   */
  groupUploadPartFinish(groupId: string, data: UploadPartFinishData) {
    return this.groupService({
      url: `/v2/groups/${groupId}/upload_part_finish`,
      method: 'post',
      data
    });
  }

  /**
   * 分片字节直传（COS 预签名地址）
   * 注意：不能用 groupService，预签名地址已自带鉴权，
   * 额外携带 QQ 鉴权头会导致 COS 签名校验失败
   * @param presignedUrl 预签名上传地址
   * @param part 分片内容
   */
  uploadPartDirect(presignedUrl: string, part: Buffer) {
    return axios.put(presignedUrl, part);
  }

  /**
   * 单聊-流式消息
   * @param userId 用户 OpenID
   * @param data 流式消息参数
   */
  streamMessages(userId: string, data: StreamMessageData) {
    return this.groupService({
      url: `/v2/users/${userId}/stream_messages`,
      method: 'post',
      data
    });
  }

  /**
   * ************
   * 消息-图片接口
   * ***********
   */

  /**
   *
   * @param channel_id
   * @param message
   * @param image
   * @returns
   */
  async channelsMessages(
    channel_id: string,
    message: {
      content?: string;
      embed?: any;
      ark?: any;
      message_reference?: any;
      image?: string;
      msg_id?: string;
      event_id?: string;
      markdown?: any;
    },
    image?: Buffer
  ): Promise<any> {
    const formdata = new FormData();

    for (const key in message) {
      if (message[key] !== undefined) {
        formdata.append(key, message[key]);
      }
    }
    if (image) {
      const from = await createPicFrom({ image });

      if (from) {
        const { picData, name } = from;

        formdata.append('file_image', picData, name);
      }
    }
    const dary = formdata.getBoundary();

    return this.guildServer({
      method: 'post',
      url: `/channels/${channel_id}/messages`,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${dary}`
      },
      data: formdata
    });
  }

  /**
   * 私聊发送
   * @param id 私信传频道id,公信传子频道id
   * @param message {消息编号,图片,内容}
   * @returns
   */
  async dmsMessages(
    guild_id: string,
    message: {
      content?: string;
      embed?: any;
      ark?: any;
      message_reference?: any;
      image?: string;
      msg_id?: string;
      event_id?: string;
      markdown?: any;
    },
    image?: Buffer
  ): Promise<any> {
    const formdata = new FormData();

    for (const key in message) {
      if (message[key] !== undefined) {
        formdata.append(key, message[key]);
      }
    }
    if (image) {
      const from = await createPicFrom({ image });

      if (from) {
        const { picData, name } = from;

        formdata.append('file_image', picData, name);
      }
    }
    const dary = formdata.getBoundary();

    return this.guildServer({
      method: 'post',
      url: `/dms/${guild_id}/messages`,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${dary}`
      },
      data: formdata
    });
  }

  /**
   * ********
   * 用户api
   * *******
   */

  /**
   * 获取用户详情
   * @param message
   * @returns
   */
  usersMe() {
    return this.guildServer({
      method: 'get',
      url: '/users/@me'
    });
  }

  /**
   * 获取用户频道列表
   * @param message
   * @returns
   */
  usersMeGuilds(params: { before: string; after: string; limit: number }) {
    return this.guildServer({
      method: 'get',
      url: '/users/@me/guilds',
      params
    });
  }

  /**
   * **********
   * 频道api
   * **********
   */

  /**
   * 获取频道详细
   * @param guild_id
   * @returns
   */
  guilds(guild_id: string) {
    return this.guildServer({
      method: 'get',
      url: `/guilds/${guild_id}`
    });
  }

  /**
   * ************
   * 子频道api
   * ***********
   */

  /**
   * 获取子频道列表
   * @param guild_id
   * @returns
   */
  guildsChannels(guild_id: string) {
    return this.guildServer({
      method: 'get',
      url: `/guilds/${guild_id}/channels`
    });
  }

  /**
   * 获取子频道详情
   * @param channel_id
   * @returns
   */
  channels(channel_id: string) {
    return this.guildServer({
      method: 'get',
      url: `/channels/${channel_id}`
    });
  }

  /**
   * 创建子频道
   * @param guild_id
   * @returns
   */
  guildsChannelsCreate(
    guild_id: string,
    data: {
      name: string;
      type?: number;
      sub_type?: number;
      position?: number;
      parent_id?: string;
      private_type?: number;
      private_user_ids?: string[];
      speak_permission?: number;
      application_id?: string;
    }
  ) {
    return this.guildServer({
      method: 'post',
      url: `/guilds/${guild_id}/channels`,
      data
    });
  }

  /**
   * 创建子频道
   * @param channel_id
   * @returns
   */
  guildsChannelsUpdate(
    channel_id: string,
    data: {
      name?: string;
      position?: number;
      parent_id?: string;
      private_type?: number;
      speak_permission?: number;
    }
  ) {
    return this.guildServer({
      method: 'PATCH',
      url: `/channels/${channel_id}`,
      data
    });
  }

  /**
   * 删除子频道
   * @param channel_id
   * @param data
   * @returns
   */
  guildsChannelsdelete(
    channel_id: string,
    data?: {
      name?: string;
      position?: number;
      parent_id?: string;
      private_type?: number;
      speak_permission?: number;
    }
  ) {
    return this.guildServer({
      method: 'DELETE',
      url: `/channels/${channel_id}`,
      data
    });
  }

  /**
   * 获取在线成员数
   * @param channel_id
   * @returns
   */
  channelsChannelOnlineNums(channel_id: string) {
    return this.guildServer({
      method: 'GET',
      url: `/channels/${channel_id}/online_nums`
    });
  }

  /**
   * *********
   * 成员api
   * *********
   */

  /**
   * 获取频道成员列表
   * @param guild_id
   * @returns
   */
  guildsMembers(
    guild_id: string,
    params: {
      after: string;
      limit: number;
    }
  ) {
    return this.guildServer({
      method: 'GET',
      url: `/guilds/${guild_id}/members`,
      params
    });
  }

  /**
   * 获取频道身份组成员列表
   * @param guild_id
   * @param role_id
   * @param params
   * @returns
   */
  guildsRolesMembers(
    guild_id: string,
    role_id: string,
    params: {
      start_index: string;
      limit: number;
    }
  ) {
    return this.guildServer({
      method: 'GET',
      url: `/guilds/${guild_id}/roles/${role_id}/members`,
      params
    });
  }

  /**
   * 获取成员详情
   * @param guild_id
   * @param user_id
   * @returns
   */
  guildsMembersMessage(guild_id: string, user_id: string) {
    return this.guildServer({
      method: 'GET',
      url: `/guilds/${guild_id}/members/${user_id}`
    });
  }

  /**
   * 删除频道成员
   * @param guild_id
   * @param user_id
   * @returns
   */
  guildsMembersDelete(guild_id: string, user_id: string) {
    return this.guildServer({
      method: 'DELETE',
      url: `/guilds/${guild_id}/members/${user_id}`
    });
  }

  /**
   * 获取指定消息
   * @param channel_id
   * @param message_id
   * @returns
   */
  channelsMessagesById(channel_id: string, message_id: string) {
    return this.guildServer({
      method: 'GET',
      url: `/channels/${channel_id}/messages/${message_id}`
    });
  }

  /**
   * 撤回消息
   * @param channel_id
   * @param message_id
   * @param hidetip
   * @returns
   */
  channelsMessagesDelete(channel_id: string, message_id: string, hidetip = true) {
    return this.guildServer({
      method: 'DELETE',
      url: `/channels/${channel_id}/messages/${message_id}?hidetip=${hidetip}`
    });
  }

  /**
   * ***********
   * 频道身份api
   * ***********
   */

  /**
   * 获取频道身份组列表
   * @param guild_id 频道id
   * @returns
   */
  guildsRoles(guild_id: string) {
    return this.guildServer({
      method: 'GET',
      url: `/guilds/${guild_id}/roles`
    });
  }

  /**
   * 创建频道身份组
   * @param guild_id 频道id
   * @param {object} data 参数
   * @param {object?} data.name 身份组名称
   * @param {object?} data.color ARGB 的 HEX 十六进制颜色值转换后的十进制数值
   * @param {object?} data.hoist 在成员列表中单独展示: 0-否, 1-是
   * @returns
   */
  guildsRolesPost(
    guild_id: string,
    data: {
      name?: string;
      color?: number;
      hoist?: 0 | 1;
    }
  ) {
    return this.guildServer({
      method: 'POST',
      url: `/guilds/${guild_id}/roles`,
      data
    });
  }

  /**
   * 修改频道身份组
   * @param guild_id 频道id
   * @param {object} data 参数
   * @param {object?} data.name 身份组名称
   * @param {object?} data.color ARGB 的 HEX 十六进制颜色值转换后的十进制数值
   * @param {object?} data.hoist 在成员列表中单独展示: 0-否, 1-是
   * @returns
   */
  guildsRolesPatch(
    guild_id: string,
    role_id: string,
    data: {
      name?: string;
      color?: number;
      hoist?: 0 | 1;
    }
  ) {
    return this.guildServer({
      method: 'PATCH',
      url: `/guilds/${guild_id}/roles/${role_id}`,
      data
    });
  }

  /**
   * 删除频道身份组
   * @param guild_id 频道id
   * @param role_id 身份组id
   */
  guildsRolesDelete(guild_id: string, role_id: string) {
    return this.guildServer({
      method: 'DELETE',
      url: `/guilds/${guild_id}/roles/${role_id}`
    });
  }

  /**
   * 将成员添加到频道身份组
   * @param guild_id 频道id
   * @param channel_id 子频道id
   * @param user_id 用户id
   * @param role_id 身份组id
   * @returns
   */

  guildsRolesMembersPut(guild_id: string, channel_id: string, user_id: string, role_id: string) {
    return this.guildServer({
      method: 'PUT',
      url: `/guilds/${guild_id}/members/${user_id}/roles/${role_id}`,
      data: {
        channel: {
          id: channel_id
        }
      }
    });
  }

  /**
   * 将成员从频道身份组移除
   * @param guild_id 频道id
   * @param channel_id 子频道id
   * @param user_id 用户id
   * @param role_id 身份组id
   * @returns
   */

  guildsRolesMembersDelete(guild_id: string, channel_id: string, user_id: string, role_id: string) {
    return this.guildServer({
      method: 'DELETE',
      url: `/guilds/${guild_id}/members/${user_id}/roles/${role_id}`,
      data: {
        channel: {
          id: channel_id
        }
      }
    });
  }

  /**
   * **********
   * 子频道权限api
   * **********
   */
  /**
   * 获取子频道用户权限
   * @param channel_id 子频道id
   * @param user_id 用户id
   */
  channelsPermissions(channel_id: string, user_id: string) {
    return this.guildServer({
      method: 'GET',
      url: `/channels/${channel_id}/members/${user_id}/permissions`
    });
  }

  /**
   * 修改子频道用户权限
   * @param channel_id 子频道id
   * @param user_id 用户id
   * @param 参数包括add和remove两个字段分别表示授予的权限以及删除的权限。要授予用户权限即把add对应位置 1，删除用户权限即把remove对应位置 1。当两个字段同一位都为 1，表现为删除权限。
   */
  channelsPermissionsPut(channel_id: string, user_id: string, add: string, remove: string) {
    return this.guildServer({
      method: 'PUT',
      url: `/channels/${channel_id}/members/${user_id}/permissions`,
      data: {
        add,
        remove
      }
    });
  }

  /**
   * *******
   * 消息api
   * ********
   */

  /**
   * ************
   * 消息频率api
   * **********
   */

  /**
   * 查询频道消息频率限制
   * @param guild_id 频道id
   * @returns
   */
  guildsMessageSetting(guild_id: string) {
    return this.guildServer({
      method: 'GET',
      url: `/guilds/${guild_id}/message/setting`
    });
  }
  /**
   * ***********
   * 私信api
   * **********
   */

  /**
   * 创建私信会话
   * @param recipient_id 接收者 id
   * @param source_guild_id 源频道 id
   * @returns
   */
  usersMeDms() {
    return this.guildServer({
      method: 'POST',
      url: '/users/@me/dms'
    });
  }

  /**
   * 撤回私信
   * @param guild_id
   * @param data
   * @returns
   */
  dmsMessageDelete(guild_id: string, message_id: string, hidetip = true) {
    return this.guildServer({
      method: 'DELETE',
      url: `/dms/${guild_id}/messages/${message_id}?hidetip=${hidetip}`
    });
  }

  /**
   * *********
   * 禁言api
   * *******
   */

  /**
   * 全体禁言（非管理员）
   * @param guild_id 频道id
   * @param data { mute_end_timestamp:禁言结束时间戳, mute_seconds:禁言时长 } 两个参数必须传一个 优先级 mute_end_timestamp > mute_seconds
   * 将mute_end_timestamp或mute_seconds传值为字符串'0'，则表示解除全体禁言
   */
  guildsMuteAll(guild_id: string, data: { mute_end_timestamp?: string; mute_seconds?: string }) {
    return this.guildServer({
      method: 'PATCH',
      url: `/guilds/${guild_id}/mute`,
      data
    });
  }

  /**
   * 频道指定成员禁言
   * @param guild_id 频道id
   * @param user_id 用户id
   * @param data { mute_end_timestamp:禁言结束时间戳, mute_seconds:禁言时长 } 两个参数必须传一个 优先级 mute_end_timestamp > mute_seconds
   * 将mute_end_timestamp或mute_seconds传值为字符串'0'，则表示解除禁言
   * @returns
   */
  guildsMemberMute(guild_id: string, user_id: string, data: { mute_end_timestamp?: string; mute_seconds?: string }) {
    return this.guildServer({
      method: 'PATCH',
      url: `/guilds/${guild_id}/members/${user_id}/mute`,
      data
    });
  }

  /**
   * 频道批量禁言
   * @param guild_id 频道id
   * @param data { mute_end_timestamp:禁言结束时间戳, mute_seconds:禁言时长, user_ids:用户id数组 } 两个参数必须传一个 优先级 mute_end_timestamp > mute_seconds
   * 将mute_end_timestamp或mute_seconds传值为字符串'0'，则表示解除禁言
   */
  guildsMute(
    guild_id: string,
    data: {
      mute_end_timestamp?: string;
      mute_seconds?: string;
      user_ids: string[];
    }
  ) {
    return this.guildServer({
      method: 'PATCH',
      url: `/guilds/${guild_id}/mute`,
      data
    });
  }

  /**
   * *******
   * 公告api
   * *******
   */

  /**
   * 创建频道公告
   * 公告类型分为 消息类型的频道公告 和 推荐子频道类型的频道公告
   * 详见 https://bot.q.qq.com/wiki/develop/api-v2/server-inter/channel/content/announces/post_guild_announces.html#%E5%8A%9F%E8%83%BD%E6%8F%8F%E8%BF%B0
   * @param guild_id 频道id
   * @param data { message_id:消息id, channel_id:频道id, announces_type:公告类型, recommend_channels:推荐频道id数组 }
   * @param channel_id 子频道id 消息id存在时必须传
   * @param announces_type 0:成员公告 1:欢迎公告 默认为 0
   * @param recommend_channels 推荐频道id数组 "recommend_channels": [{ "channel_id": "xxxx","introduce": "推荐语" }]
   * @returns 返回Announces 对象 （https://bot.q.qq.com/wiki/develop/api-v2/server-inter/channel/content/announces/model.html#Announces）
   */
  guildsAnnounces(
    guild_id: string,
    data: {
      message_id?: string;
      channel_id?: string;
      announces_type?: 0 | 1;
      recommend_channels?: string[];
    }
  ) {
    return this.guildServer({
      method: 'POST',
      url: `/guilds/${guild_id}/announces`,
      data
    });
  }
  /**
   * 删除频道公告
   * @param guild_id 频道id
   * @param message_id 消息id message_id 有值时，会校验 message_id 合法性，若不校验校验 message_id，请将 message_id 设置为 all
   * @returns
   */

  guildsAnnouncesDelete(guild_id: string, message_id: string) {
    return this.guildServer({
      method: 'DELETE',
      url: `/guilds/${guild_id}/announces/${message_id}`
    });
  }

  /**
   * **********
   * 精华消息api
   * **********
   */

  /**
   * 添加精华消息
   * @param channel_id 频道id
   * @param message_id 消息id
   * @returns  返回 PinsMessage对象 {  "guild_id": "xxxxxx",  "channel_id": "xxxxxx",  "message_ids": ["xxxxx"]}
   * @returns message_ids 为当前请求后子频道内所有精华消息 message_id 数组
   */
  channelsPinsPut(channel_id: string, message_id: string) {
    return this.guildServer({
      method: 'PUT',
      url: `/channels/${channel_id}/pins/${message_id}`
    });
  }
  /**
   * 删除精华消息
   * @param channel_id 子频道id
   * @param message_id 消息id
   * 删除子频道内全部精华消息，请将 message_id 设置为 all
   * @returns
   */

  channelsPinsDelete(channel_id: string, message_id: string) {
    return this.guildServer({
      method: 'DELETE',
      url: `/channels/${channel_id}/pins/${message_id}`
    });
  }

  /**
   * 获取精华消息
   * @param channel_id 子频道id
   * @returns 返回 PinsMessage对象 {  "guild_id": "xxxxxx",  "channel_id": "xxxxxx",  "message_ids": ["xxxxx"]}
   * @returns message_ids 为当前请求后子频道内所有精华消息 message_id 数组
   */
  channelsPins(channel_id: string) {
    return this.guildServer({
      method: 'GET',
      url: `/channels/${channel_id}/pins`
    });
  }

  /**
   * ********
   * 日程api
   * *******
   */

  /**
   * 获取频道日程列表
   * @param channel_id 子频道id
   * @returns 返回 Schedule 对象数组(详见https://bot.q.qq.com/wiki/develop/api-v2/server-inter/channel/content/schedule/model.html#schedule)
   */

  channelsSchedules(channel_id: string) {
    return this.guildServer({
      method: 'GET',
      url: `/channels/${channel_id}/schedules`
    });
  }

  /**
   * 获取频道日程详情
   * @param channel_id 子频道id
   * @param schedule_id 日程id
   * @returns 返回 Schedule 对象(详见https://bot.q.qq.com/wiki/develop/api-v2/server-inter/channel/content/schedule/model.html#schedule)
   */

  channelsSchedulesSchedule(channel_id: string, schedule_id: string) {
    return this.guildServer({
      method: 'GET',
      url: `/channels/${channel_id}/schedules/${schedule_id}`
    });
  }

  /**
   * 创建频道日程
   * @param channel_id 子频道id
   * @param name 日程名称
   * @param description 日程描述
   * @param start_timestamp 日程开始时间戳
   * @param end_timestamp 日程结束时间戳
   * @param jump_channel_id 日程开始时跳转的子频道id
   * @param remind_type 日程提醒类型
   *  0不提醒
   *  1开始时提醒
   *  2开始前 5 分钟提醒
   *  3开始前 15 分钟提醒
   *  4开始前 30 分钟提醒
   *  5开始前 60 分钟提醒
   * @returns 返回 Schedule 对象(详见https://bot.q.qq.com/wiki/develop/api-v2/server-inter/channel/content/schedule/model.html#schedule)
   */

  channelsSchedulesPost(
    channel_id: string,
    data: {
      schedule: {
        name: string;
        description?: string;
        start_timestamp: string;
        end_timestamp: string;
        jump_channel_id: string;
        remind_type: number;
      };
    }
  ) {
    return this.guildServer({
      method: 'POST',
      url: `/channels/${channel_id}/schedules`,
      data
    });
  }

  /**
   * 修改频道日程
   * @param channel_id 子频道id
   * @param schedule_id 日程id
   * @param name 日程名称
   * @param description 日程描述
   * @param start_timestamp 日程开始时间戳
   * @param end_timestamp 日程结束时间戳
   * @param jump_channel_id 日程开始时跳转的子频道id
   * @param remind_type 日程提醒类型
   * 0不提醒
   * 1开始时提醒
   * 2开始前 5 分钟提醒
   * 3开始前 15 分钟提醒
   * 4开始前 30 分钟提醒
   * 5开始前 60 分钟提醒
   * @returns 返回 Schedule 对象(详见https://bot.q.qq.com/wiki/develop/api-v2/server-inter/channel/content/schedule/model.html#schedule)
   */
  channelsSchedulesSchedulePatch(
    channel_id: string,
    schedule_id: string,
    data: {
      schedule: {
        name: string;
        description?: string;
        start_timestamp: string;
        end_timestamp: string;
        jump_channel_id: string;
        remind_type: number;
      };
    }
  ) {
    return this.guildServer({
      method: 'PATCH',
      url: `/channels/${channel_id}/schedules/${schedule_id}`,
      data
    });
  }

  /**
   * 删除频道日程
   * @param channel_id 子频道id
   * @param schedule_id 日程id
   * @returns
   */

  channelsSchedulesScheduleDelete(channel_id: string, schedule_id: string) {
    return this.guildServer({
      method: 'DELETE',
      url: `/channels/${channel_id}/schedules/${schedule_id}`
    });
  }

  /**
   * ***********
   * 表情表态api
   * ***********
   */

  /**
   * 机器人发表表情表态
   * @param channel_id 子频道id
   * @param message_id 消息id
   * @param type 表情类型 1：系统表情 2：emoji表情
   * @param id 表情id 参考https://bot.q.qq.com/wiki/develop/api-v2/openapi/emoji/model.html#Emoji%20%E5%88%97%E8%A1%A8
   * @returns
   */

  channelsMessagesReactionsPut(channel_id: string, message_id: string, type: 1 | 2, id: string) {
    return this.guildServer({
      method: 'PUT',
      url: `/channels/${channel_id}/messages/${message_id}/reactions/${type}/${id}`
    });
  }

  /**
   * 删除机器人发表的表情表态
   * @param channel_id 子频道id
   * @param message_id 消息id
   * @param type 表情类型 1：系统表情 2：emoji表情
   * @param id 表情id 参考https://bot.q.qq.com/wiki/develop/api-v2/openapi/emoji/model.html#Emoji%20%E5%88%97%E8%A1%A8
   * @returns
   */

  channelsMessagesReactionsDelete(channel_id: string, message_id: string, type: 1 | 2, id: string) {
    return this.guildServer({
      method: 'DELETE',
      url: `/channels/${channel_id}/messages/${message_id}/reactions/${type}/${id}`
    });
  }

  /**
   * 获取消息表情表态的用户列表
   * @param channel_id 子频道id
   * @param message_id 消息id
   * @param type 表情类型 1：系统表情 2：emoji表情
   * @param id 表情id 参考https://bot.q.qq.com/wiki/develop/api-v2/openapi/emoji/model.html#Emoji%20%E5%88%97%E8%A1%A8
   * @param {object} data
   * @param {object} data.cookie 返回的cookie 第一次请求不传，后续请求传上次返回的cookie
   * @param {object} data.limit 返回的用户数量 默认20 最大50
   * @returns data:{ users:User[], cookie:string,is_end:true|false }
   */
  channelsMessagesReactionsUsers(
    channel_id: string,
    message_id: string,
    type: 1 | 2,
    id: string,
    data: {
      cookie?: string;
      limit?: number;
    }
  ) {
    return this.guildServer({
      method: 'GET',
      url: `/channels/${channel_id}/messages/${message_id}/reactions/${type}/${id}`,
      data
    });
  }

  /**
   * ***********
   * 音频api
   * 音频接口：仅限音频类机器人才能使用，后续会根据机器人类型自动开通接口权限，现如需调用，需联系平台申请权限
   * **********
   */

  /**
   * 音频控制
   * @param channel_id 子频道id
   * @param audio_url 音频url status为0时传
   * @param status  0:开始 1:暂停 2:继续 3:停止
   * @param text 状态文本（比如：简单爱-周杰伦），可选，status为0时传，其他操作不传
   * @returns
   */
  channelsAudioPost(
    channel_id: string,
    data: {
      audio_url?: string;
      text?: string;
      status: 0 | 1 | 2 | 3;
    }
  ) {
    return this.guildServer({
      method: 'POST',
      url: `/channels/${channel_id}/audio`,
      data
    });
  }

  /**
   * 机器人上麦
   * @param channel_id 语音子频道id
   * @returns {}
   */
  channelsMicPut(channel_id: string) {
    return this.guildServer({
      method: 'PUT',
      url: `/channels/${channel_id}/mic`
    });
  }
  /**
   * 机器人下麦
   * @param channel_id 语音子频道id
   * @returns {}
   */

  channelsMicDelete(channel_id: string) {
    return this.guildServer({
      method: 'DELETE',
      url: `/channels/${channel_id}/mic`
    });
  }
  /**
   * **********
   * 帖子api
   * 注意
   * 公域机器人暂不支持申请，仅私域机器人可用，选择私域机器人后默认开通。
   * 注意: 开通后需要先将机器人从频道移除，然后重新添加，方可生效。
   * **********
   */

  /**
   * 获取帖子列表
   * @param channel_id 子频道id
   * @returns {threads:Thread[],is_finish:0|1}
   * @returns 返回 Thread 对象数组(详见https://bot.q.qq.com/wiki/develop/api-v2/server-inter/channel/content/forum/model.html#Thread)
   * @returns is_finish 为 1 时，表示已拉取完 为 0 时，表示未拉取完
   */
  channelsThreads(channel_id: string) {
    return this.guildServer({
      method: 'GET',
      url: `/channels/${channel_id}/threads`
    });
  }

  /**
   * 获取帖子详情
   * @param channel_id 子频道id
   * @param thread_id 帖子id
   * @returns 返回 帖子详情对象(详见https://bot.q.qq.com/wiki/develop/api-v2/server-inter/channel/content/forum/model.html#ThreadInfo)
   * 其中content字段可参考 https://bot.q.qq.com/wiki/develop/api-v2/server-inter/channel/content/forum/model.html#RichText
   */
  channelsThreadsThread(channel_id: string, thread_id: string) {
    return this.guildServer({
      method: 'GET',
      url: `/channels/${channel_id}/threads/${thread_id}`
    });
  }

  /**
   * 发表帖子
   * @param channel_id 子频道id
   * @param title 帖子标题
   * @param content 帖子内容
   * @param format 帖子内容格式 1:纯文本 2:HTML 3:Markdown 4:JSON
   * @returns 返回 {task_id:string,create_time:string} 其中 task_id 为帖子id，create_time 发帖时间戳
   */

  channelsThreadsPut(
    channel_id: string,
    data: {
      title: string;
      content: string;
      format: 1 | 2 | 3 | 4;
    }
  ) {
    return this.guildServer({
      method: 'PUT',
      url: `/channels/${channel_id}/threads`,
      data
    });
  }
  /**
   * 删除帖子
   * @param channel_id 子频道id
   * @param thread_id 帖子id
   * @returns
   */

  channelsThreadsDelete(channel_id: string, thread_id: string) {
    return this.guildServer({
      method: 'DELETE',
      url: `/channels/${channel_id}/threads/${thread_id}`
    });
  }
  /**
   * ********
   * 接口权限api
   * **********
   */

  /**
   * 获得频道可用权限列表
   * @param guild_id
   * @returns
   */
  guildApiPermission(guild_id: string) {
    return this.guildServer({
      url: `/guilds/${guild_id}/api_permission`
    });
  }

  /**
   * 交互事件回应
   * @param interaction_id
   * @param code
   * @returns
   */
  interactionResponse(_mode: 'group' | 'guild', interaction_id: string, code?: number) {
    return this.groupService({
      method: 'PUT',
      url: `/interactions/${interaction_id}`,
      data: {
        code: code || 0
      }
    });
  }
}
