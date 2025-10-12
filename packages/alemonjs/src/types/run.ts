type ServerOptions = {
  /**
   * @description 服务器端口
   */
  port?: number;
};

type ClientOptions = {
  /**
   * @description 连接到 CBP 服务器的 URL
   */
  url?: string;
};

export type StartOptions = ServerOptions &
  ClientOptions & {
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
