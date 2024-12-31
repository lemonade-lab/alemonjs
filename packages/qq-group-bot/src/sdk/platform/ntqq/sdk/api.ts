import { config } from './config.js'
import axios, { type AxiosRequestConfig } from 'axios'
import { FileType, MessageType } from './typings.js'

interface ButtonType {
  // 编号
  id: string
  render_data: {
    // 标头
    label: string
    // 点击后的标头
    visited_label: string
    // 0 灰色
    // 1 蓝色
    // 风格
    style: number
  }
  action: {
    // 0 跳转按钮：http 或 小程序 客户端识别 scheme
    // 1 回调按钮：回调后台接口, data 传给后台
    // 2 指令按钮：自动在输入框插入 @bot data
    type: number
    permission: {
      // 0 指定用户可操作
      // 1 仅管理者可操作
      // 2 所有人可操作
      // 3 指定身份组可操作（仅频道可用）
      type: number
    }
    // 默认 false
    reply?: boolean
    // 自动发送
    enter?: boolean
    // 兼容性提示文本
    unsupport_tips: string
    // 内容
    data: string
  }
}

export interface KeyboardType {
  id?: string
  content?: {
    rows: { buttons: ButtonType[] }[]
  }
}

export interface MarkdownType {
  /** markdown 模版id，申请模版后获得 */
  custom_template_id: string
  /** 原生 markdown 文本内容（内邀使用） */
  content?: string
  /** 模版内变量与填充值的kv映射 */
  params?: Array<{ key: string; values: string[] }>
}

export interface ApiRequestData {
  content?: string
  msg_type: MessageType
  markdown?: MarkdownType
  keyboard?: KeyboardType
  media?: {
    file_info: string
  }
  ark?: any
  image?: any
  message_reference?: any
  event_id?: any
  msg_id?: string
  msg_seq?: number
}

export class QQBotGroupAPI {
  /**
   * qq机器人
   */
  BOTS_API_RUL = 'https://bots.qq.com'

  /**
   * qq群 沙河接口
   */
  API_URL_SANDBOX = 'https://sandbox.api.sgroup.qq.com'

  /**
   * qq群
   */
  API_URL = 'https://api.sgroup.qq.com'

  /**
   * 得到鉴权
   * @param appId
   * @param clientSecret
   * @param url
   * @returns
   */
  getAuthentication(appId: string, clientSecret: string) {
    return axios.post(`${this.BOTS_API_RUL}/app/getAppAccessToken`, {
      appId: appId,
      clientSecret: clientSecret
    })
  }

  /**
   * 创建axios实例
   * @param config
   * @returns
   */
  async GroupService(options: AxiosRequestConfig) {
    const appId = config.get('appId')
    const token = config.get('token')
    const service = await axios.create({
      baseURL: this.API_URL,
      timeout: 20000,
      headers: {
        'X-Union-Appid': appId,
        'Authorization': `QQBot ${token}`
      }
    })
    return service(options)
  }

  /**
   * 得到鉴权
   * @returns
   */
  async gateway() {
    return this.GroupService({
      url: '/gateway'
    }).then(res => res?.data)
  }

  /**
   * 发送私聊消息
   * @param openid
   * @param content
   * @param msg_id
   * @returns
   *   0 文本  1 图文 2 md 3 ark 4 embed
   */
  async usersOpenMessages(
    openid: string,
    data: ApiRequestData,
    msg_id?: string
  ): Promise<{ id: string; timestamp: number }> {
    console.log('msg_id', msg_id)
    return this.GroupService({
      url: `/v2/users/${openid}/messages`,
      method: 'post',
      data: data
    }).then(res => res?.data)
  }

  // /\[🔗[^\]]+\]\([^)]+\)|@everyone/.test(content)

  #map: Map<string, number> = new Map()

  /**
   * 得到消息序列
   * @param MessageId
   * @returns
   */
  getMessageSeq(MessageId: string): number {
    let seq = this.#map.get(MessageId) || 0
    seq++
    this.#map.set(MessageId, seq)
    // 如果映射表大小超过 100，则删除最早添加的 MessageId
    if (this.#map.size > 100) {
      const firstKey = this.#map.keys().next().value
      this.#map.delete(firstKey)
    }
    return seq
  }

  /**
   * 发送群聊消息
   * @param group_openid
   * @param content
   * @param msg_id
   * @returns
   */
  async groupOpenMessages(
    group_openid: string,
    data: ApiRequestData
  ): Promise<{ id: string; timestamp: number }> {
    return this.GroupService({
      url: `/v2/groups/${group_openid}/messages`,
      method: 'post',
      data: data
    }).then(res => res?.data)
  }

  /**
   * 发送私聊富媒体文件
   * @param openid
   * @param content
   * @param file_type
   * @returns
   *  1 图文 2 视频 3 语言 4 文件
   * 图片：png/jpg，视频：mp4，语音：silk
   */
  async postRichMediaByUsers(
    openid: string,
    data: {
      srv_send_msg?: boolean
      file_type: FileType
      url?: string
      file_data?: any
    }
  ): Promise<{ file_uuid: string; file_info: string; ttl: number }> {
    return this.GroupService({
      url: `/v2/users/${openid}/files`,
      method: 'post',
      data: data
    }).then(res => res?.data)
  }

  /**
   * 发送私聊富媒体文件
   * @param openid
   * @param content
   * @param file_type
   * @returns
   *  1 图文 2 视频 3 语言 4 文件
   * 图片：png/jpg，视频：mp4，语音：silk
   */
  async userFiles(
    openid: string,
    data: {
      srv_send_msg: boolean
      file_type: FileType
      url: string
      file_data?: any
    }
  ): Promise<{ file_uuid: string; file_info: string; ttl: number }> {
    return this.GroupService({
      url: `/v2/users/${openid}/files`,
      method: 'post',
      data: data
    }).then(res => res?.data)
  }

  /**
   * 发送群里文件
   * @param openid
   * @param content
   * @param file_type
   * @returns
   *  1 图文 2 视频 3 语言 4 文件
   * 图片：png/jpg，视频：mp4，语音：silk
   */
  async postRichMediaByGroup(
    openid: string,
    data: {
      srv_send_msg?: boolean
      file_type: FileType
      url?: string
      file_data?: any
    }
  ): Promise<{ file_uuid: string; file_info: string; ttl: number }> {
    return this.GroupService({
      url: `/v2/groups/${openid}/files`,
      method: 'post',
      data: {
        srv_send_msg: false,
        ...data
      }
    }).then(res => res?.data)
  }

  /**
   *
   * @param openid
   * @param data
   * @returns
   */
  async groupsFiles(
    openid: string,
    data: {
      srv_send_msg?: boolean
      file_type: FileType
      url?: string
      file_data?: any
    }
  ): Promise<{ file_uuid: string; file_info: string; ttl: number }> {
    return this.GroupService({
      url: `/v2/groups/${openid}/files`,
      method: 'post',
      data: {
        srv_send_msg: false,
        ...data
      }
    }).then(res => res?.data)
  }

  /**
   * 创建模板
   * *********
   * 使用该方法,你需要申请模板Id
   * 并设置markdown源码为{{.text_0}}{{.text_1}}
   * {{.text_2}}{{.text_3}}{{.text_4}}{{.text_5}}
   * {{.text_6}}{{.text_7}}{{.text_8}}{{.text_9}}
   * 当前,你也可以传递回调对key和values进行休整
   * @param custom_template_id
   * @param mac 默认 9
   * @param callBack 默认 (key,values)=>({key,values})
   * @returns
   */
  createTemplate(
    custom_template_id: string,
    mac = 10,
    callBack = (key: string, values: string[]) => ({ key, values })
  ) {
    let size = -1
    const params = []
    const Id = custom_template_id

    /**
     * 消耗一个参数
     * @param value 值
     * @param change 是否换行
     * @returns
     */
    const text = (value: string, change = false) => {
      // 仅限push
      if (size > mac - 1) return
      size++
      params.push(callBack(`text_${size}`, [`${value}${change ? '\r' : ''}`]))
    }

    /**
     * 消耗一个参数
     * @param start  开始的值
     * @param change 是否换行
     * @returns
     */
    const prefix = (start: string, label: string) => {
      text(`${start}[${label}]`)
    }

    /**
     * 消耗一个参数
     * @param param0.value 发送的值
     * @param param0.enter 是否自动发送
     * @param param0.reply 是否回复
     * @param param0.change 是否换行
     * @param param0.end 尾部字符串
     */
    const suffix = ({ value, enter = true, reply = false, change = false, end = '' }) => {
      text(
        `(mqqapi://aio/inlinecmd?command=${value}&enter=${enter}&reply=${reply})${end}${
          change ? '\r' : ''
        }`
      )
    }

    /**
     * 消耗2个参数
     * @param param0.label 显示的值
     * @param param0.value 发送的值
     * @param param0.enter 是否自动发送
     * @param param0.reply 是否回复
     * @param param0.change 是否换行
     * @param param0.start 头部字符串
     * @param param0.end 尾部字符串
     */
    const button = ({
      label,
      value,
      start = '',
      end = '',
      enter = true,
      reply = false,
      change = false
    }) => {
      // size 只少留两个
      if (size > mac - 1 - 2) return
      prefix(start, label)
      suffix({ value, enter, reply, change, end })
    }

    /**
     * **********
     * 代码块
     * **********
     * 跟在后面
     * 前面需要设置换行
     * 消耗4个参数
     * @param val
     * @returns
     */
    const code = (val: string) => {
      // size 至少留4个
      if (size > mac - 1 - 4) return
      text('``')
      text('`javascript\r' + val)
      text('\r`')
      text('``\r')
    }

    const getParam = () => {
      return {
        msg_type: 2,
        markdown: {
          custom_template_id: Id,
          params
        }
      }
    }

    return {
      size,
      text,
      prefix,
      suffix,
      button,
      code,
      getParam
    }
  }

  /**
   *
   * @param openid
   * @param message_id
   * @returns
   */
  userMessageDelete(openid: string, message_id: string) {
    return this.GroupService({
      url: `/v2/users/${openid}/messages/${message_id}`,
      method: 'delete'
    }).then(res => res?.data)
  }

  /**
   *
   * @param group_openid
   * @param message_id
   * @returns
   */
  grouMessageDelte(group_openid: string, message_id: string) {
    return this.GroupService({
      url: `/v2/groups/${group_openid}/messages/${message_id}`,
      method: 'delete'
    }).then(res => res?.data)
  }
}
