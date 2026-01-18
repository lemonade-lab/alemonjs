import WebSocket from 'ws';
import { actionResolves, actionTimeouts, generateUniqueId, timeoutTime } from './config';

/**
 *
 * @param ws
 * @param data
 * @returns
 */
const send = (
  ws: WebSocket,
  data: {
    echo?: string;
    [key: string]: any;
  }
): Promise<any> => {
  const id = generateUniqueId();

  // 设置唯一标识符
  data.echo = id;

  return new Promise((resolve, reject) => {
    actionResolves.set(id, { resolve, reject });
    // 发送消息
    ws.send(JSON.stringify(data));
    // 30 秒后超时
    const timeout = setTimeout(() => {
      // 被清理了
      if (!actionResolves.has(id) || !actionTimeouts.has(id)) {
        return;
      }
      // 删除回调
      actionResolves.delete(id);
      // 删除超时器
      actionTimeouts.delete(id);
      // 不会当错误进行处理。而是传入错误码
      resolve(null);
    }, timeoutTime);

    actionTimeouts.set(id, timeout);
  });
};

// 消费
export const consume = (parsedMessage: any) => {
  // 读取 唯一标识
  const id = parsedMessage.echo;
  const { resolve, reject } = actionResolves.get(id) || {};

  actionResolves.delete(id);
  // 清除超时器
  const timeout = actionTimeouts.get(id);

  if (timeout) {
    actionTimeouts.delete(id);
    clearTimeout(timeout);
  }
  if (!resolve || !reject) {
    return;
  }
  if (![0, 1].includes(parsedMessage?.retcode)) {
    reject(parsedMessage?.data);

    return;
  }
  resolve(parsedMessage?.data);
};

export class OneBotAPI {
  public ws: WebSocket | null = null;
  /**
   * 发送私聊消息
   * @param options
   * @returns
   */
  sendPrivateMessage(options: { user_id: number; message: any[] }) {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'send_private_msg',
      params: options
    });
  }

  /**
   * 发送群消息
   * @param options
   * @returns
   */
  sendGroupMessage(options: { group_id: number; message: any[] }) {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'send_group_msg',
      params: options
    });
  }

  /**
   * 发送消息
   * @param options
   * @returns
   */
  sendMessage(options: { message_type: 'private' | 'group'; group_id?: number; user_id?: number; message: any[] }) {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'send_msg',
      params: options
    });
  }

  /** 撤回消息 */
  deleteMsg(options: { message_id: number }) {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'delete_msg',
      params: options
    });
  }

  /**
   * @param options
   * @returns
   */
  getMsg(options: { message_id: number }) {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'get_msg',
      params: options
    });
  }

  /**
   * 获取合并转发的消息
   * @param options
   */
  getForwardMsg(options: { id: string }) {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'get_forward_msg',
      params: options
    });
  }

  /**
   * 发送好友赞
   * @param options
   * @returns
   */
  sendLike(options: { user_id: number; times?: number }) {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'send_like',
      params: options
    });
  }

  // 群组踢人
  setGroupKick(options: { group_id: number; user_id: number; reject_add_request?: boolean }) {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'set_group_kick',
      params: options
    });
  }

  // 群组单人禁言
  setGroupBan(options: { group_id: number; user_id: number; duration: number }) {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'set_group_ban',
      params: options
    });
  }

  // 群组匿名用户禁言
  setGroupAnonymousBan(options: { group_id: number; anonymous: { id: string; name: string }; duration: number }) {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'set_group_anonymous_ban',
      params: options
    });
  }

  // 群组全员禁言
  setGroupWholeBan(options: { group_id: number; enable: boolean }) {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'set_group_whole_ban',
      params: options
    });
  }

  // 群组设置管理员
  setGroupAdmin(options: { group_id: number; user_id: number; enable: boolean }) {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'set_group_admin',
      params: options
    });
  }

  // 群组匿名
  setGroupAnonymous(options: { group_id: number; enable: boolean }) {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'set_group_anonymous',
      params: options
    });
  }

  // 设置群名片（群备注）
  setGroupCard(options: { group_id: number; user_id: number; card: string }) {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'set_group_card',
      params: options
    });
  }

  // 设置群名
  setGroupName(options: { group_id: number; group_name: string }) {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'set_group_name',
      params: options
    });
  }

  // 退出群组
  setGroupLeave(options: { group_id: number; is_dismiss?: boolean }) {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'set_group_leave',
      params: options
    });
  }

  // 设置群组专属头
  setGroupSpecialTitle(options: { group_id: number; user_id: number; special_title: string; duration: number }) {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'set_group_special_title',
      params: options
    });
  }

  /**
   * 处理好友请求
   * @param options
   * @returns
   */
  setFriendAddRequest(options: { flag: string; approve: boolean; remark?: string }) {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'set_friend_add_request',
      params: options
    });
  }

  /**
   * 处理群请求
   * @param options
   * @returns
   */
  setGroupAddRequest(options: { flag: string; sub_type: string; approve: boolean; reason?: string }) {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'set_group_add_request',
      params: options
    });
  }

  // 获取登录信息
  getLoginInfo() {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'get_login_info',
      params: {}
    });
  }

  // get_stranger_info
  getStrangerInfo(options: { user_id: number; no_cache?: boolean }) {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'get_stranger_info',
      params: options
    });
  }

  /**
   * 好友列表
   */
  getFriendList() {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'get_friend_list',
      params: {}
    });
  }

  /**
   * 获取群信息
   */
  getGroupInfo(params?: { group_id: number; no_cache?: boolean }) {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'get_group_info',
      params: params
    });
  }

  /**
   * 获取群列表
   */
  getGroupList() {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'get_group_list',
      params: {}
    });
  }

  // 获取群成员信息
  getGroupMemberInfo(options: { group_id: number; user_id: number; no_cache?: boolean }) {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'get_group_member_info',
      params: options
    });
  }

  /**
   * 群成员列表
   * @param options
   * @returns
   */
  getGroupMemberList(options: { group_id: number }) {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'get_group_member_list',
      params: options
    });
  }

  // 获取群荣誉信息
  getGroupHonorInfo(options: { group_id: number; type: 'talkative' | 'performer' | 'legend' | 'strong_newbie' }) {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'get_group_honor_info',
      params: options
    });
  }

  // get_cookies
  getCookies() {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'get_cookies',
      params: {}
    });
  }

  // get_csrf_token
  getCsrfToken() {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'get_csrf_token',
      params: {}
    });
  }

  // get_credentials
  getCredentials() {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'get_credentials',
      params: {}
    });
  }

  // get_record
  getRecord(options: { file: string }) {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'get_record',
      params: options
    });
  }

  // get_image
  getImage(options: { file: string }) {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'get_image',
      params: options
    });
  }

  // can_send_image
  canSendImage() {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'can_send_image',
      params: {}
    });
  }

  // can_send_record
  canSendRecord() {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'can_send_record',
      params: {}
    });
  }

  // get_status
  getStatus() {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'get_status',
      params: {}
    });
  }

  // get_version_info
  getVersionInfo() {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'get_version_info',
      params: {}
    });
  }
  // set_restart
  setRestart() {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'set_restart',
      params: {}
    });
  }

  // clean_cache
  cleanCache() {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'clean_cache',
      params: {}
    });
  }

  /** 上传私聊文件 */
  uploadPrivateFile(options: { user_id: number; file: string; name?: string }) {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'upload_private_file',
      params: options
    });
  }

  /** 上传群文件 */
  uploadGroupFile(options: { group_id: number; file: string; name?: string; folder?: string }) {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'upload_group_file',
      params: options
    });
  }

  /** 发送私聊转发 */
  sendPrivateForward(options: {
    user_id: number;
    messages: {
      time?: number;
      content: any[];
      user_id?: string;
      nickname?: string;
    }[];
  }) {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'send_private_forward_msg',
      params: {
        user_id: 80000000,
        nickname: '匿名消息',
        ...options,
        messages: options.messages.map(data => ({ data, type: 'node' }))
      }
    });
  }

  /** 发送群转发 */
  sendGroupForward(options: {
    group_id: number;
    messages: {
      time?: number;
      content: any[];
      user_id?: string;
      nickname?: string;
    }[];
  }) {
    if (!this.ws) {
      return;
    }

    return send(this.ws, {
      action: 'send_group_forward_msg',
      params: {
        user_id: 80000000,
        nickname: '匿名消息',
        ...options,
        messages: options.messages.map(data => ({ data, type: 'node' }))
      }
    });
  }
}
