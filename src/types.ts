// 登录配置
export interface LoginConfig {
  // 机器人账号
  id: string;
  // 机器人密码
  key: string;
  // 是私域？
  private: boolean;
  // 机器人密钥
  secret?: string;
  // 主人账号
  account?: string;
  // 主人编号
  master?: string;
  // 主人密码
  password?: string;
  // 是沙盒？
  sandbox?: boolean;
}

// 身份类型
export interface IdentityType {
  //频道主人
  master: boolean;
  //成员
  member: boolean;
  //等级
  grade: string;
  //管理员
  admins: boolean;
  //子频道管理员
  wardens: boolean;
}
