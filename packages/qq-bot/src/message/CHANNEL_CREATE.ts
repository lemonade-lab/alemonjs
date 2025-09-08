export type CHANNEL_CREATE_TYPE = {
  application_id?: string; // 创建时
  guild_id: string; // 频道id
  id: string;
  name: string; // 频道name
  op_user_id: string;
  owner_id: string;
  parent_id?: string; // 创建时
  permissions?: string; // 创建时
  position?: number; // 创建时
  private_type: number;
  speak_permission: number;
  sub_type: number;
  type: number;
};
