import { IntentsEnum } from './intents';
import type { SessionStore } from './session.js';

//  0 文本  1 图文 2 md 3 ark 4 embed 6 输入状态 7 图片
export type MessageType = 0 | 1 | 2 | 3 | 4 | 6 | 7;
//    1 图文 2 视频 3 语言 4 文件
export type FileType = 1 | 2 | 3 | 4;

export interface ButtonType {
  // 编号
  id: string;
  render_data: {
    // 标头
    label: string;
    // 点击后的标头
    visited_label: string;
    // 0 灰色
    // 1 蓝色
    // 风格
    style?: number;
  };
  action: {
    // 0 跳转按钮：http 或 小程序 客户端识别 scheme
    // 1 回调按钮：回调后台接口, data 传给后台
    // 2 指令按钮：自动在输入框插入 @bot data
    type: number;
    permission: {
      // 0 指定用户可操作
      // 1 仅管理者可操作
      // 2 所有人可操作
      // 3 指定身份组可操作（仅频道可用）
      type: number;
    };
    // 默认 false
    reply?: boolean;
    // 自动发送
    enter?: boolean;
    // 兼容性提示文本
    unsupport_tips?: string;
    // 内容
    data: string | { click: string; confirm: string; cancel: string };
    //
    at_bot_show_channel_list?: boolean;
  };
}

export interface KeyboardType {
  id?: string;
  content?: {
    rows: { buttons: ButtonType[] }[];
  };
}

export interface MarkdownType {
  /** markdown 模版id，申请模版后获得 */
  custom_template_id?: string;
  /** 原生 markdown 文本内容（内邀使用） */
  content?: string;
  /** 模版内变量与填充值的kv映射 */
  params?: Array<{ key: string; values: string[] }>;
}

export interface ApiRequestData {
  content?: string;
  msg_type: MessageType;
  markdown?: MarkdownType;
  keyboard?: KeyboardType;
  media?: {
    file_info: string;
  };
  ark?: any;
  image?: any;
  message_reference?: any;
  event_id?: any;
  msg_id?: string;
  msg_seq?: number;
  /**
   * 互动召回消息，true 时不校验 msg_id/event_id 有效期
   */
  is_wakeup?: boolean;
  /**
   * 是否校验图片转存结果。true 时图片转存失败将返回错误且不发送消息，默认 false
   */
  force_verify_image_resource?: boolean;
  /**
   * 输入状态通知（msg_type=6，仅单聊支持）
   */
  input_notify?: {
    /**
     * 输入状态类型，当前固定为 1（正在输入）
     */
    input_type: number;
    /**
     * 展示时长（秒）
     */
    input_second: number;
  };
}

// ─── 群管理 ───

/**
 * 用户入群验证信息
 */
export interface VerifyInfo {
  /**
   * 验证方式：verify_message 或 admin_review_qa
   */
  method: string;
  /**
   * 验证消息内容，仅 method=verify_message 时可能携带
   */
  verify_message?: string;
  /**
   * 管理员问答列表，仅 method=admin_review_qa 时可能携带
   */
  review_qa_list?: {
    /**
     * 管理员设置的问题
     */
    question: string;
    /**
     * 申请人填写的答案
     */
    answer: string;
  }[];
}

/**
 * 入群申请
 */
export interface JoinRequest {
  /**
   * 申请 ID，审批接口需要回传
   */
  join_request_id: string;
  /**
   * 安全提示语
   */
  risk_tips?: string;
  /**
   * 用户在应用或开放平台下的统一标识
   */
  union_openid?: string;
  /**
   * 申请人的 openid
   */
  member_openid: string;
  /**
   * 申请人昵称
   */
  username: string;
  /**
   * 申请时间戳，RFC3339 格式
   */
  apply_at: string;
  /**
   * self_apply 主动申请，invited 被邀请
   */
  apply_source: string;
  /**
   * 邀请人的 openid，仅 apply_source=invited 时生效
   */
  invited_by?: string;
  /**
   * 是否为机器人账号
   */
  bot: boolean;
  /**
   * 用户入群验证信息
   */
  verify_info?: VerifyInfo;
  /**
   * 自动审批通过的扩展信息
   */
  auto_approved?: {
    /**
     * 自动审批通过所命中的策略 ID
     */
    strategy_id: string;
  };
}

/**
 * 群全局禁言规则
 */
export interface GlobalMuteRule {
  /**
   * none 不禁言 / always 始终禁言 / schedule 按计划禁言
   */
  mode: 'none' | 'always' | 'schedule';
  /**
   * 定时禁言规则
   */
  schedule_rules?: {
    task_id: string;
    start_at: string;
    end_at: string;
    enabled: boolean;
  }[];
  /**
   * 周期禁言规则
   */
  recurring_rules?: {
    task_id: string;
    weekdays: number[];
    start_time: string;
    end_time: string;
    enabled: boolean;
  }[];
}

/**
 * 群成员禁言状态
 */
export interface MemberMuteState {
  member_openid: string;
  mute_expire_at: string;
  username: string;
  union_openid: string;
}

/**
 * 设置群成员禁言
 */
export interface SetMemberMuteState {
  /**
   * add 增加 / update 更新到期时间 / del 解除
   */
  op: 'add' | 'update' | 'del';
  /**
   * 群成员 openid（只能操作普通成员）
   */
  member_openid: string;
  /**
   * RFC3339 到期时间，op=del 可传空串立即解除
   */
  mute_expire_at?: string;
}

/**
 * 入群自动审批策略
 */
export interface JoinApprovalStrategy {
  strategy_id: string;
  group_openids: string[];
  group_ids: string[];
  /**
   * 白名单人数估算
   */
  whitelist_user_count: number;
  is_enable: 'on' | 'off';
  expire_at: string;
  created_at: string;
  updated_at: string;
  remark: string;
}

/**
 * 策略群操作
 */
export interface GroupAction {
  op: 'add' | 'del';
  group_openids?: string[];
  group_ids?: string[];
}

// ─── 分片上传 / 流式消息 ───

/**
 * 分片上传准备参数
 */
export interface UploadPrepareData {
  /**
   * 1 图片 / 2 视频 / 3 语音 / 4 文件
   */
  file_type: FileType;
  file_name: string;
  /**
   * 文件大小（字节）
   */
  file_size: string;
  /**
   * 完整文件 MD5
   */
  md5: string;
  /**
   * 完整文件 SHA1
   */
  sha1: string;
  /**
   * 文件前 10002432 字节（约 10MB）的 MD5
   */
  md5_10m: string;
}

/**
 * 分片信息
 */
export interface UploadPart {
  /**
   * 分片序号，从 0 开始
   */
  index: number;
  /**
   * 预签名上传地址（COS 直传）
   */
  presigned_url: string;
  /**
   * 当前分片大小（字节）
   */
  block_size: string;
}

/**
 * 上传并发/重试配置
 */
export interface UploadConfig {
  concurrency: number;
  retry_timeout: number;
  retry_delay: number;
}

/**
 * 分片上传准备结果
 */
export interface UploadPrepareResult {
  upload_id: string;
  block_size: string;
  parts: UploadPart[];
  upload_config: UploadConfig;
}

/**
 * 分片完成参数
 */
export interface UploadPartFinishData {
  upload_id: string;
  /**
   * 分片序号，对应 parts.index
   */
  part_index: number;
  /**
   * 当前分片大小（字节）
   */
  block_size: string;
  /**
   * 当前分片内容 MD5
   */
  md5: string;
}

/**
 * 流式消息参数（仅单聊）
 */
export interface StreamMessageData {
  /**
   * append 追加（默认）/ replace 替换（传当前全量正文）
   */
  input_mode?: 'append' | 'replace';
  /**
   * 1 生成中 / 10 生成结束
   */
  input_state?: 1 | 10;
  content_type?: 'text' | 'markdown';
  content_raw?: string;
  event_id?: string;
  msg_id?: string;
  /**
   * 去重序号，同一条流式消息内保持一致
   */
  msg_seq?: number;
  /**
   * 流式分片序号，从 0 递增
   */
  index?: number;
  /**
   * 首次请求不填，后续填首次响应中的 id
   */
  stream_msg_id?: string;
  is_wakeup?: boolean;
}

/**
 * 流式消息响应
 */
export interface StreamMessageResult {
  id: string;
  timestamp: string;
  ext_info?: {
    ref_idx?: string;
  };
  /**
   * 流式消息剩余长度（字符）
   */
  remain_msg_len?: number;
}

export interface Options {
  /**
   * 应用编号
   */
  app_id: string;
  /**
   * 密钥
   */
  secret: string;
  /**
   * 分片
   * [0, 1]
   */
  shard?: number[];
  /**
   * 事件订阅
   */
  intents?: IntentsEnum[];
  /**
   * 是否是私域
   * false
   */
  is_private?: boolean;
  /**
   * 是否是沙盒环境
   * false
   */
  sandbox?: boolean;
  /**
   * 路由
   */
  route?: string;
  /**
   * 端口
   */
  port?: string;
  /**
   * WebSocket 地址
   */
  ws?: string;
  /**
   * WebSocket 网关地址
   */
  gatewayURL?: string;
  /**
   * API 基础地址
   */
  base_url_gateway?: string;
  /**
   * API 基础地址（获取 access_token）
   */
  base_url_app_access_token?: string;
  /** Programmatic persistence override; file persistence is the default. */
  sessionStore?: SessionStore;
}
