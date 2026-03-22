type ServerOptions = {
  /** @deprecated 请使用 cbp.port */
  port?: number;
  /** @deprecated 已无消费者 */
  server_port?: number;
};

type ClientOptions = {
  /** @deprecated 请使用 cbp.url */
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

type AuthOptions = {
  auth?: {
    master?: {
      id?: { [key: string]: boolean };
      key?: { [key: string]: boolean };
    };
    bot?: {
      id?: { [key: string]: boolean };
      key?: { [key: string]: boolean };
    };
  };
  /** @deprecated 请使用 auth.master */
  master_key?: {
    [key: string]: boolean;
  };
  /** @deprecated 请使用 auth.master */
  master_id?: {
    [key: string]: boolean;
  };
};

type EventOptions = {
  event?: {
    repeated_event_time?: number;
    repeated_user_time?: number;
    disabled?: {
      text_regular?: string;
      selects?: { [key: string]: boolean };
      user_id?: { [key: string]: boolean };
      user_key?: { [key: string]: boolean };
    };
    transforms?: { pattern: string; target: string }[];
  };
  /** @deprecated 请使用 event.disabled */
  disabled_text_regular?: string;
  /** @deprecated 请使用 event.disabled */
  disabled_selects?: {
    [key: string]: boolean;
  };
  /** @deprecated 请使用 event.disabled */
  disabled_user_id?: {
    [key: string]: boolean;
  };
  /** @deprecated 请使用 event.disabled */
  disabled_user_key?: {
    [key: string]: boolean;
  };
  /** @deprecated 请使用 event.transforms */
  redirect_text_regular?: string;
  /** @deprecated 请使用 event.transforms */
  redirect_text_target?: string;
  /** @deprecated 请使用 event.transforms */
  mapping_text?: {
    regular?: string;
    target?: string;
  }[];
  /** @deprecated 请使用 event */
  processor?: {
    repeated_event_time?: number;
    repeated_user_time?: number;
  };
};

type ModulesOptions = {
  modules?: {
    [key: string]: boolean;
  };
  /** @deprecated 请使用 modules */
  apps?: {
    [key: string]: boolean;
  };
};

type CBPOptions = {
  cbp?: {
    /** 是否启用 CBP 服务器 */
    enable?: boolean;
    /** CBP 服务器端口 */
    port?: number | string;
    /** CBP 远程连接地址 */
    url?: string;
    /** 是否全量接收消息 */
    is_full_receive?: boolean;
    /** CBP 应用插件 */
    plugins?: {
      [packageName: string]:
        | {
            path?: string;
            enable?: boolean;
          }
        | true;
    };
    /** @deprecated 请使用 cbp.plugins */
    apps?: {
      [packageName: string]:
        | {
            path?: string;
            enable?: boolean;
          }
        | true;
    };
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

export type StartOptions = ServerOptions & ClientOptions & AppOptions & AuthOptions & EventOptions & ModulesOptions & CBPOptions;
