//  0 文本  1 图文 2 md 3 ark 4 embed 7 图片
export type MessageType = 0 | 1 | 2 | 3 | 4 | 7
//    1 图文 2 视频 3 语言 4 文件
export type FileType = 1 | 2 | 3 | 4

export interface ButtonType {
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
    style?: number
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
    unsupport_tips?: string
    // 内容
    data: string | { click: string; confirm: string; cancel: string }
    //
    at_bot_show_channel_list?: boolean
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
  custom_template_id?: string
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

export interface Options {
  secret: string
  app_id: string
  token: string
  sandbox?: boolean
  route?: string
  port?: string
  ws?: string
}
