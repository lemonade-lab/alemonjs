// 定义事件枚举
export enum ActionsEventEnum {
  // 消息撤回
  MessageRecall = 'message.recall',
  // 消息删除
  MessageDelete = 'message.delete',
  // 消息创建（普通、引用、转发）
  MessageCreate = 'message.create',
  // 消息编辑
  MessageEdit = 'message.edit',
  // 消息列表
  MessageList = 'message.list',
  // 消息置顶
  MessageTop = 'message.top',
  // 消息取消置顶
  MessageUntop = 'message.untop',
  // 消息点赞
  MessageLike = 'message.like',
  // 消息取消点赞
  MessageUnlike = 'message.unlike',
  // 服务器创建
  GuildCreate = 'guild.create',
  // 服务器删除
  GuildDelete = 'guild.delete',
  // 服务器编辑
  GuildEdit = 'guild.edit',
  // 服务器退出
  GuildQuit = 'guild.quit',
  // 服务器加入
  GuildJoin = 'guild.join',
  // 成员列表
  MemberList = 'member.list',
  // 成员添加
  MemberAdd = 'member.add',
  // 成员删除
  MemberDelete = 'member.delete',
  // 成员编辑
  MemberEdit = 'member.edit',
  // 角色添加
  RoleAdd = 'role.add',
  // 角色删除
  RoleDelete = 'role.delete',
  // 角色编辑
  RoleEdit = 'role.edit',
  // 角色列表
  RoleList = 'role.list',
  // 频道创建
  ChannelCreate = 'channel.create',
  // 频道删除
  ChannelDelete = 'channel.delete',
  // 频道编辑
  ChannelEdit = 'channel.edit',
  // 频道列表
  ChannelList = 'channel.list',
  // 分类创建
  CategoryCreate = 'category.create',
  // 分类删除
  CategoryDelete = 'category.delete',
  // 分类编辑
  CategoryEdit = 'category.edit',
  // 分类列表
  CategoryList = 'category.list',
  // 成员踢出
  MemberKickOut = 'member.kickOut',
  // 成员封禁
  MemberBan = 'member.ban',
  // 成员解封
  MemberUnban = 'member.unban'
}
