import WebSocket from 'ws'
import { actionResolves, actionTimeouts, generateUniqueId, timeoutTime } from './config'

/**
 *
 * @param ws
 * @param data
 * @returns
 */
const send = (
  ws: WebSocket,
  data: {
    echo?: string
    [key: string]: any
  }
): Promise<any> => {
  const id = generateUniqueId()
  // 设置唯一标识符
  data.echo = id
  return new Promise((resolve, reject) => {
    actionResolves.set(id, { resolve, reject })
    // 发送消息
    ws.send(JSON.stringify(data))
    // 30 秒后超时
    const timeout = setTimeout(() => {
      // 被清理了
      if (!actionResolves.has(id) || !actionTimeouts.has(id)) {
        return
      }
      // 删除回调
      actionResolves.delete(id)
      // 删除超时器
      actionTimeouts.delete(id)
      // 不会当错误进行处理。而是传入错误码
      resolve(null)
    }, timeoutTime)
    actionTimeouts.set(id, timeout)
  })
}

// 消费
export const consume = (parsedMessage: any) => {
  // 读取 唯一标识
  const id = parsedMessage.echo
  const { resolve, reject } = actionResolves.get(id) || {}
  actionResolves.delete(id)
  // 清除超时器
  const timeout = actionTimeouts.get(id)
  if (timeout) {
    actionTimeouts.delete(id)
    clearTimeout(timeout)
  }
  if (!resolve || !reject) {
    return
  }
  if (![0, 1].includes(parsedMessage?.retcode)) {
    reject(parsedMessage?.data)
    return
  }
  resolve(parsedMessage?.data)
}

export class OneBotAPI {
  public ws: WebSocket | null = null
  /**
   * 发送私聊消息
   * @param options
   * @returns
   */
  sendPrivateMessage(options: { user_id: number; message: any[] }) {
    if (!this.ws) return
    return send(this.ws, {
      action: 'send_private_msg',
      params: options
    })
  }

  /**
   * 发送群消息
   * @param options
   * @returns
   */
  sendGroupMessage(options: { group_id: number; message: any[] }) {
    if (!this.ws) return
    return send(this.ws, {
      action: 'send_group_msg',
      params: options
    })
  }

  /**
   * 发送消息
   * @param options
   * @returns
   */
  sendMessage(options: {
    message_type: 'private' | 'group'
    group_id?: number
    user_id?: number
    message: any[]
  }) {
    if (!this.ws) return
    return send(this.ws, {
      action: 'send_msg',
      params: options
    })
  }

  /**
   * 好友列表
   */
  getFriendList() {
    if (!this.ws) return
    return send(this.ws, {
      action: 'get_friend_list',
      params: {}
    })
  }

  /**
   * 群列表
   */
  getGroupList() {
    if (!this.ws) return
    return send(this.ws, {
      action: 'get_group_list',
      params: {}
    })
  }

  /**
   * 群成员列表
   * @param options
   * @returns
   */
  getGroupMemberList(options: { group_id: number }) {
    if (!this.ws) return
    return send(this.ws, {
      action: 'get_group_member_list',
      params: options
    })
  }

  /**
   * 处理好友请求
   * @param options
   * @returns
   */
  setFriendAddRequest(options: { flag: string; approve: boolean; remark?: string }) {
    if (!this.ws) return
    return send(this.ws, {
      action: 'set_friend_add_request',
      params: options
    })
  }

  /**
   * 处理群请求
   * @param options
   * @returns
   */
  setGroupAddRequest(options: {
    flag: string
    sub_type: string
    approve: boolean
    reason?: string
  }) {
    if (!this.ws) return
    return send(this.ws, {
      action: 'set_group_add_request',
      params: options
    })
  }

  /** 撤回消息 */
  deleteMsg(options: { message_id: number }) {
    if (!this.ws) return
    return send(this.ws, {
      action: 'delete_msg',
      params: options
    })
  }

  /** 上传私聊文件 */
  uploadPrivateFile(options: { user_id: number; file: string; name?: string }) {
    if (!this.ws) return
    return send(this.ws, {
      action: 'upload_private_file',
      params: options
    })
  }

  /** 上传群文件 */
  uploadGroupFile(options: { group_id: number; file: string; name?: string; folder?: string }) {
    if (!this.ws) return
    return send(this.ws, {
      action: 'upload_group_file',
      params: options
    })
  }

  /** 发送私聊转发 */
  sendPrivateForward(options: {
    user_id: number
    messages: {
      time?: number
      content: any[]
      user_id?: string
      nickname?: string
    }[]
  }) {
    if (!this.ws) return
    return send(this.ws, {
      action: 'send_private_forward_msg',
      params: {
        user_id: 80000000,
        nickname: '匿名消息',
        ...options,
        messages: options.messages.map(data => ({ data, type: 'node' }))
      }
    })
  }

  /** 发送群转发 */
  sendGroupForward(options: {
    group_id: number
    messages: {
      time?: number
      content: any[]
      user_id?: string
      nickname?: string
    }[]
  }) {
    if (!this.ws) return
    return send(this.ws, {
      action: 'send_group_forward_msg',
      params: {
        user_id: 80000000,
        nickname: '匿名消息',
        ...options,
        messages: options.messages.map(data => ({ data, type: 'node' }))
      }
    })
  }
}
