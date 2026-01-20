type ServerOptions = {
  /**
   * @description 协议端口
   */
  port?: number;
  /**
   * @description 应用服务器端口
   */
  serverPort?: number;
};

type ClientOptions = {
  /**
   * @description 连接到 CBP 服务器的 URL
   */
  url?: string;
};

type AppOptions = {
  /**
   * @description 入口文件路径
   */
  input?: string;
  /**
   * @description 平台名称
   */
  platform?: string;
  /**
   * @description 登录名
   */
  login?: string;
  /**
   * @description 是否全量接收
   */
  is_full_receive?: boolean;
};

type MasterOptions = {
  master_key?: {
    [key: string]: boolean;
  };
  master_id?: {
    [key: string]: boolean;
  };
};

type BotOptions = {
  bot_key?: {
    [key: string]: boolean;
  };
  bot_id?: {
    [key: string]: boolean;
  };
};

type MessageOptions = {
  disabled_text_regular?: string;
  disabled_selects?: {
    [key: string]: boolean;
  };
  disabled_user_id?: {
    [key: string]: boolean;
  };
  disabled_user_key?: {
    [key: string]: boolean;
  };
  redirect_text_regular?: string;
  redirect_text_target?: string;
  mapping_text?: {
    regular?: string;
    target?: string;
  }[];
};

type ProcessorOptions = {
  processor?: {
    repeated_event_time?: number;
    repeated_user_time?: number;
  };
};

type AppsOptions = {
  apps?: {
    [key: string]: boolean;
  };
};

type CBPOptions = {
  cbp?: {
    timeout?: number;
    reconnectInterval?: string;
    heartbeatInterval?: string;
    healthCheckInterval?: string;
    headers?: {
      'user-agent': string;
      'x-device-id': string;
      'x-full-receive': '0' | '1';
      [key: string]: string;
    };
  };
};

export type StartOptions = ServerOptions &
  ClientOptions &
  AppOptions &
  MasterOptions &
  BotOptions &
  MessageOptions &
  ProcessorOptions &
  AppsOptions &
  CBPOptions;
