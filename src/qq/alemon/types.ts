/**
 * 可查看子频道	0x0000000001(1 << 0)	支持指定成员可见类型，支持身份组可见类型
 * 可管理子频道	0x0000000002(1 << 1)	创建者、管理员、子频道管理员都具有此权限
 * 可发言子频道	0x0000000004(1 << 2)	支持指定成员发言类型，支持身份组发言类型
 * 可直播子频道	0x0000000008 (1 << 3)	支持指定成员发起直播，支持身份组发起直播；仅可在直播子频道中设置
 */
export const permissions = {
  look: 1,
  manage: 2,
  speak: 4,
  broadcast: 8
}

// 权限模板
export const not_permissions = {
  state: false,
  look: false,
  manage: false,
  speak: false,
  broadcast: false,
  botmiss: 0
}
