// 登录配置
export interface LoginConfig {
  id: string; // 机器人账号
  key: string; // 机器人密码
  private: boolean; // 属性?
  secret?: string; // 机器人密钥
  account?: string; // 主人账号
  master?: string; // 主人编号
  password?: string; // 主人密码
  sendbox?: boolean; // 是沙盒？
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
  //子频道管理也
  wardens: boolean;
}
