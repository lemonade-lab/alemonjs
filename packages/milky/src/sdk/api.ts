export type MilkyConnectionState = 'idle' | 'connecting' | 'ready' | 'offline' | 'failed';
export type MilkyTransport = 'ws' | 'sse' | 'webhook' | null;
export type MilkyConnectionStatus = {
  state: MilkyConnectionState;
  transport: MilkyTransport;
  baseUrl: string;
  apiBaseUrl: string;
  selfId?: string;
  reason?: string;
};

export type MilkyApiResponse = {
  status?: 'ok' | 'failed';
  retcode: number;
  data?: any;
  message?: string;
  error?: string;
  wording?: string;
  [key: string]: any;
};

export type MilkyApiOptions = {
  baseUrl?: string;
  apiBaseUrl?: string;
  accessToken?: string;
  timeoutMs?: number;
};

/**
 * Milky HTTP API 客户端。
 *
 * 与 OneBot 的 WebSocket action 不同，Milky 通过
 * POST /api/:action 调用协议端，响应统一为
 * { status, retcode, data, message? }。
 */
export class MilkyAPI {
  #baseUrl = '';
  #apiBaseUrl = '';
  #accessToken = '';
  #timeoutMs = 15_000;
  #connectionStatus: MilkyConnectionStatus = {
    state: 'idle',
    transport: null,
    baseUrl: '',
    apiBaseUrl: ''
  };

  constructor(options: MilkyApiOptions = {}) {
    this.configure(options);
  }

  configure(options: MilkyApiOptions = {}) {
    if (options.baseUrl !== undefined) this.#baseUrl = options.baseUrl;
    if (options.apiBaseUrl !== undefined) this.#apiBaseUrl = options.apiBaseUrl;
    if (options.accessToken !== undefined) this.#accessToken = options.accessToken;
    if (options.timeoutMs !== undefined) this.#timeoutMs = options.timeoutMs;
    this.#connectionStatus = {
      ...this.#connectionStatus,
      baseUrl: this.#baseUrl,
      apiBaseUrl: this.#apiBaseUrl
    };
  }

  /** Read-only snapshot for useClient<API>() and desktop diagnostics. */
  getConnectionStatus(): MilkyConnectionStatus {
    return { ...this.#connectionStatus };
  }

  protected updateConnectionStatus(patch: Partial<MilkyConnectionStatus>) {
    this.#connectionStatus = {
      ...this.#connectionStatus,
      ...patch,
      baseUrl: patch.baseUrl ?? this.#connectionStatus.baseUrl,
      apiBaseUrl: patch.apiBaseUrl ?? this.#connectionStatus.apiBaseUrl
    };
  }

  get apiBaseUrl() {
    return this.#apiBaseUrl;
  }

  async callApi(action: string, params: Record<string, any> = {}): Promise<MilkyApiResponse> {
    const url = `${this.#apiBaseUrl}/${action}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.#accessToken) {
      headers.Authorization = `Bearer ${this.#accessToken}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.#timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(params ?? {}),
        signal: controller.signal
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch (err: any) {
        return this.makeApiError(action, `响应解析失败: ${err?.message ?? err}`, {
          http_status: res.status
        });
      }

      if (!res.ok) {
        return this.makeApiError(action, `HTTP ${res.status}`, {
          http_status: res.status,
          data
        });
      }

      if (!data || typeof data !== 'object') {
        return this.makeApiError(action, '响应格式非法', {
          http_status: res.status
        });
      }

      if (typeof data.retcode === 'undefined') {
        data.retcode = 0;
      }
      if (!data.status) {
        data.status = data.retcode === 0 ? 'ok' : 'failed';
      }
      if (data.retcode !== 0 && typeof data.error === 'undefined') {
        data.error = data.message || data.wording || 'unknown error';
      }

      return data as MilkyApiResponse;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return this.makeApiError(action, `请求超时(${this.#timeoutMs}ms)`);
      }

      return this.makeApiError(action, err?.message ?? String(err));
    } finally {
      clearTimeout(timer);
    }
  }

  makeApiError(action: string, error: string, extra: Record<string, any> = {}): MilkyApiResponse {
    return {
      retcode: -1,
      status: 'failed',
      action,
      data: null,
      error,
      wording: error,
      ...extra
    };
  }

  // ─── 系统 API ───

  getLoginInfo() {
    return this.callApi('get_login_info', {});
  }

  getImplInfo() {
    return this.callApi('get_impl_info', {});
  }

  getUserProfile(params: { user_id: string | number }) {
    return this.callApi('get_user_profile', { user_id: Number(params.user_id) });
  }

  getFriendList(params?: { no_cache?: boolean }) {
    return this.callApi('get_friend_list', params ?? {});
  }

  getFriendInfo(params: { user_id: string | number; no_cache?: boolean }) {
    return this.callApi('get_friend_info', {
      user_id: Number(params.user_id),
      no_cache: params.no_cache ?? false
    });
  }

  getGroupList(params?: { no_cache?: boolean }) {
    return this.callApi('get_group_list', params ?? {});
  }

  getGroupInfo(params: { group_id: string | number; no_cache?: boolean }) {
    return this.callApi('get_group_info', {
      group_id: Number(params.group_id),
      no_cache: params.no_cache ?? false
    });
  }

  getGroupMemberList(params: { group_id: string | number; no_cache?: boolean }) {
    return this.callApi('get_group_member_list', {
      group_id: Number(params.group_id),
      no_cache: params.no_cache ?? false
    });
  }

  getGroupMemberInfo(params: { group_id: string | number; user_id: string | number; no_cache?: boolean }) {
    return this.callApi('get_group_member_info', {
      group_id: Number(params.group_id),
      user_id: Number(params.user_id),
      no_cache: params.no_cache ?? false
    });
  }

  getPeerPins() {
    return this.callApi('get_peer_pins', {});
  }

  setPeerPin(params: { message_scene: 'friend' | 'group' | 'temp'; peer_id: string | number; is_pinned?: boolean }) {
    return this.callApi('set_peer_pin', {
      message_scene: params.message_scene,
      peer_id: Number(params.peer_id),
      is_pinned: params.is_pinned ?? true
    });
  }

  setAvatar(params: { uri: string }) {
    return this.callApi('set_avatar', { uri: params.uri });
  }

  setNickname(params: { new_nickname: string }) {
    return this.callApi('set_nickname', { new_nickname: params.new_nickname });
  }

  setBio(params: { new_bio: string }) {
    return this.callApi('set_bio', { new_bio: params.new_bio });
  }

  getCustomFaceUrlList() {
    return this.callApi('get_custom_face_url_list', {});
  }

  getCookies(params: { domain: string }) {
    return this.callApi('get_cookies', { domain: params.domain });
  }

  getCsrfToken() {
    return this.callApi('get_csrf_token', {});
  }

  // ─── 消息 API ───

  sendPrivateMessage(params: { user_id: string | number; message: any[] }) {
    return this.callApi('send_private_message', {
      user_id: Number(params.user_id),
      message: params.message
    });
  }

  sendGroupMessage(params: { group_id: string | number; message: any[] }) {
    return this.callApi('send_group_message', {
      group_id: Number(params.group_id),
      message: params.message
    });
  }

  recallPrivateMessage(params: { user_id: string | number; message_seq: string | number }) {
    return this.callApi('recall_private_message', {
      user_id: Number(params.user_id),
      message_seq: Number(params.message_seq)
    });
  }

  recallGroupMessage(params: { group_id: string | number; message_seq: string | number }) {
    return this.callApi('recall_group_message', {
      group_id: Number(params.group_id),
      message_seq: Number(params.message_seq)
    });
  }

  getMessage(params: { message_scene: 'friend' | 'group' | 'temp'; peer_id: string | number; message_seq: string | number }) {
    return this.callApi('get_message', {
      message_scene: params.message_scene,
      peer_id: Number(params.peer_id),
      message_seq: Number(params.message_seq)
    });
  }

  getHistoryMessages(params: {
    message_scene: 'friend' | 'group' | 'temp';
    peer_id: string | number;
    start_message_seq?: string | number;
    limit?: number;
  }) {
    return this.callApi('get_history_messages', {
      message_scene: params.message_scene,
      peer_id: Number(params.peer_id),
      start_message_seq: params.start_message_seq !== undefined ? Number(params.start_message_seq) : undefined,
      limit: params.limit ?? 20
    });
  }

  getResourceTempUrl(params: { resource_id: string }) {
    return this.callApi('get_resource_temp_url', { resource_id: params.resource_id });
  }

  getForwardedMessages(params: { forward_id: string }) {
    return this.callApi('get_forwarded_messages', { forward_id: params.forward_id });
  }

  markMessageAsRead(params: { message_scene: 'friend' | 'group' | 'temp'; peer_id: string | number; message_seq: string | number }) {
    return this.callApi('mark_message_as_read', {
      message_scene: params.message_scene,
      peer_id: Number(params.peer_id),
      message_seq: Number(params.message_seq)
    });
  }

  // ─── 好友 API ───

  sendFriendNudge(params: { user_id: string | number; is_self?: boolean }) {
    return this.callApi('send_friend_nudge', {
      user_id: Number(params.user_id),
      is_self: params.is_self ?? false
    });
  }

  sendProfileLike(params: { user_id: string | number; count?: number }) {
    return this.callApi('send_profile_like', {
      user_id: Number(params.user_id),
      count: params.count ?? 1
    });
  }

  deleteFriend(params: { user_id: string | number }) {
    return this.callApi('delete_friend', { user_id: Number(params.user_id) });
  }

  getFriendRequests(params?: { limit?: number; is_filtered?: boolean }) {
    return this.callApi('get_friend_requests', {
      limit: params?.limit ?? 20,
      is_filtered: params?.is_filtered ?? false
    });
  }

  acceptFriendRequest(params: { initiator_uid: string; is_filtered?: boolean }) {
    return this.callApi('accept_friend_request', {
      initiator_uid: params.initiator_uid,
      is_filtered: params.is_filtered ?? false
    });
  }

  rejectFriendRequest(params: { initiator_uid: string; is_filtered?: boolean; reason?: string }) {
    return this.callApi('reject_friend_request', {
      initiator_uid: params.initiator_uid,
      is_filtered: params.is_filtered ?? false,
      reason: params.reason
    });
  }

  // ─── 群聊 API ───

  setGroupName(params: { group_id: string | number; new_group_name: string }) {
    return this.callApi('set_group_name', {
      group_id: Number(params.group_id),
      new_group_name: params.new_group_name
    });
  }

  setGroupAvatar(params: { group_id: string | number; image_uri: string }) {
    return this.callApi('set_group_avatar', {
      group_id: Number(params.group_id),
      image_uri: params.image_uri
    });
  }

  setGroupMemberCard(params: { group_id: string | number; user_id: string | number; card: string }) {
    return this.callApi('set_group_member_card', {
      group_id: Number(params.group_id),
      user_id: Number(params.user_id),
      card: params.card
    });
  }

  setGroupMemberSpecialTitle(params: { group_id: string | number; user_id: string | number; special_title: string }) {
    return this.callApi('set_group_member_special_title', {
      group_id: Number(params.group_id),
      user_id: Number(params.user_id),
      special_title: params.special_title
    });
  }

  setGroupMemberAdmin(params: { group_id: string | number; user_id: string | number; is_set?: boolean }) {
    return this.callApi('set_group_member_admin', {
      group_id: Number(params.group_id),
      user_id: Number(params.user_id),
      is_set: params.is_set ?? true
    });
  }

  setGroupMemberMute(params: { group_id: string | number; user_id: string | number; duration?: number }) {
    return this.callApi('set_group_member_mute', {
      group_id: Number(params.group_id),
      user_id: Number(params.user_id),
      duration: params.duration ?? 0
    });
  }

  setGroupWholeMute(params: { group_id: string | number; is_mute?: boolean }) {
    return this.callApi('set_group_whole_mute', {
      group_id: Number(params.group_id),
      is_mute: params.is_mute ?? true
    });
  }

  kickGroupMember(params: { group_id: string | number; user_id: string | number; reject_add_request?: boolean }) {
    return this.callApi('kick_group_member', {
      group_id: Number(params.group_id),
      user_id: Number(params.user_id),
      reject_add_request: params.reject_add_request ?? false
    });
  }

  getGroupAnnouncements(params: { group_id: string | number }) {
    return this.callApi('get_group_announcements', { group_id: Number(params.group_id) });
  }

  sendGroupAnnouncement(params: { group_id: string | number; content: string; image_uri?: string }) {
    return this.callApi('send_group_announcement', {
      group_id: Number(params.group_id),
      content: params.content,
      image_uri: params.image_uri
    });
  }

  deleteGroupAnnouncement(params: { group_id: string | number; announcement_id: string }) {
    return this.callApi('delete_group_announcement', {
      group_id: Number(params.group_id),
      announcement_id: params.announcement_id
    });
  }

  getGroupEssenceMessages(params: { group_id: string | number; page_index: number; page_size: number }) {
    return this.callApi('get_group_essence_messages', {
      group_id: Number(params.group_id),
      page_index: params.page_index,
      page_size: params.page_size
    });
  }

  setGroupEssenceMessage(params: { group_id: string | number; message_seq: string | number; is_set?: boolean }) {
    return this.callApi('set_group_essence_message', {
      group_id: Number(params.group_id),
      message_seq: Number(params.message_seq),
      is_set: params.is_set ?? true
    });
  }

  quitGroup(params: { group_id: string | number }) {
    return this.callApi('quit_group', { group_id: Number(params.group_id) });
  }

  sendGroupMessageReaction(params: {
    group_id: string | number;
    message_seq: string | number;
    reaction: string;
    reaction_type?: 'face' | 'emoji';
    is_add?: boolean;
  }) {
    return this.callApi('send_group_message_reaction', {
      group_id: Number(params.group_id),
      message_seq: Number(params.message_seq),
      reaction: params.reaction,
      reaction_type: params.reaction_type ?? 'face',
      is_add: params.is_add ?? true
    });
  }

  sendGroupNudge(params: { group_id: string | number; user_id: string | number }) {
    return this.callApi('send_group_nudge', {
      group_id: Number(params.group_id),
      user_id: Number(params.user_id)
    });
  }

  getGroupNotifications(params?: { start_notification_seq?: string | number; is_filtered?: boolean; limit?: number }) {
    return this.callApi('get_group_notifications', {
      start_notification_seq:
        params?.start_notification_seq !== undefined ? Number(params.start_notification_seq) : undefined,
      is_filtered: params?.is_filtered ?? false,
      limit: params?.limit ?? 20
    });
  }

  acceptGroupRequest(params: {
    notification_seq: string | number;
    notification_type: 'join_request' | 'invited_join_request';
    group_id: string | number;
    is_filtered?: boolean;
  }) {
    return this.callApi('accept_group_request', {
      notification_seq: Number(params.notification_seq),
      notification_type: params.notification_type,
      group_id: Number(params.group_id),
      is_filtered: params.is_filtered ?? false
    });
  }

  rejectGroupRequest(params: {
    notification_seq: string | number;
    notification_type: 'join_request' | 'invited_join_request';
    group_id: string | number;
    is_filtered?: boolean;
    reason?: string;
  }) {
    return this.callApi('reject_group_request', {
      notification_seq: Number(params.notification_seq),
      notification_type: params.notification_type,
      group_id: Number(params.group_id),
      is_filtered: params.is_filtered ?? false,
      reason: params.reason
    });
  }

  acceptGroupInvitation(params: { group_id: string | number; invitation_seq: string | number }) {
    return this.callApi('accept_group_invitation', {
      group_id: Number(params.group_id),
      invitation_seq: Number(params.invitation_seq)
    });
  }

  rejectGroupInvitation(params: { group_id: string | number; invitation_seq: string | number }) {
    return this.callApi('reject_group_invitation', {
      group_id: Number(params.group_id),
      invitation_seq: Number(params.invitation_seq)
    });
  }

  // ─── 文件 API ───

  uploadPrivateFile(params: { user_id: string | number; file_uri: string; file_name: string }) {
    return this.callApi('upload_private_file', {
      user_id: Number(params.user_id),
      file_uri: params.file_uri,
      file_name: params.file_name
    });
  }

  uploadGroupFile(params: {
    group_id: string | number;
    parent_folder_id?: string;
    file_uri: string;
    file_name: string;
  }) {
    return this.callApi('upload_group_file', {
      group_id: Number(params.group_id),
      parent_folder_id: params.parent_folder_id ?? '/',
      file_uri: params.file_uri,
      file_name: params.file_name
    });
  }

  getPrivateFileDownloadUrl(params: {
    user_id: string | number;
    file_id: string;
    file_hash: string;
    is_self_send?: boolean;
  }) {
    return this.callApi('get_private_file_download_url', {
      user_id: Number(params.user_id),
      file_id: params.file_id,
      file_hash: params.file_hash,
      is_self_send: params.is_self_send ?? false
    });
  }

  getGroupFileDownloadUrl(params: { group_id: string | number; file_id: string }) {
    return this.callApi('get_group_file_download_url', {
      group_id: Number(params.group_id),
      file_id: params.file_id
    });
  }

  getGroupFiles(params: { group_id: string | number; parent_folder_id?: string }) {
    return this.callApi('get_group_files', {
      group_id: Number(params.group_id),
      parent_folder_id: params.parent_folder_id ?? '/'
    });
  }

  moveGroupFile(params: {
    group_id: string | number;
    file_id: string;
    parent_folder_id?: string;
    target_folder_id?: string;
  }) {
    return this.callApi('move_group_file', {
      group_id: Number(params.group_id),
      file_id: params.file_id,
      parent_folder_id: params.parent_folder_id ?? '/',
      target_folder_id: params.target_folder_id ?? '/'
    });
  }

  renameGroupFile(params: {
    group_id: string | number;
    file_id: string;
    parent_folder_id?: string;
    new_file_name: string;
  }) {
    return this.callApi('rename_group_file', {
      group_id: Number(params.group_id),
      file_id: params.file_id,
      parent_folder_id: params.parent_folder_id ?? '/',
      new_file_name: params.new_file_name
    });
  }

  deleteGroupFile(params: { group_id: string | number; file_id: string }) {
    return this.callApi('delete_group_file', {
      group_id: Number(params.group_id),
      file_id: params.file_id
    });
  }

  persistGroupFile(params: { group_id: string | number; file_id: string }) {
    return this.callApi('persist_group_file', {
      group_id: Number(params.group_id),
      file_id: params.file_id
    });
  }

  createGroupFolder(params: { group_id: string | number; folder_name: string }) {
    return this.callApi('create_group_folder', {
      group_id: Number(params.group_id),
      folder_name: params.folder_name
    });
  }

  renameGroupFolder(params: { group_id: string | number; folder_id: string; new_folder_name: string }) {
    return this.callApi('rename_group_folder', {
      group_id: Number(params.group_id),
      folder_id: params.folder_id,
      new_folder_name: params.new_folder_name
    });
  }

  deleteGroupFolder(params: { group_id: string | number; folder_id: string }) {
    return this.callApi('delete_group_folder', {
      group_id: Number(params.group_id),
      folder_id: params.folder_id
    });
  }
}
