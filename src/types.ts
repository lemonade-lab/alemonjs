// 登录配置
export interface LoginConfig {
  id: string; // 机器人账号
  key: string; // 机器人钥匙
  authority: Array<string>; // 权限
  secret?: string; // 机器人密钥
  account?: string; // 主人账号
  password?: string; // 主人密码
  sendbox?: boolean; // 是沙盒？
}

// 应用类型
export interface AppType {
  [key: string]: object;
}

// 权限类型
export interface PermissionsType {
  //子频道权限
  state: boolean;
  //可查看
  look: boolean;
  //可管理
  manage: boolean;
  //可发言
  speak: boolean;
  //可直播
  broadcast: boolean;
  //权限权重
  botmiss: number;
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
