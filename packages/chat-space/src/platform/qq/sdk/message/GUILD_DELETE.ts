/**
 * 机器人退出频道
 * @param event
 * @returns
 */
export type GUILD_DELETE_TYPE = {
  description: string
  icon: string // 频道 a
  id: string // 频道 id
  joined_at: string // msg_time
  max_members: number
  member_count: number
  name: string // 频道name
  op_user_id: string
  owner: boolean
  owner_id: string
  union_appid: string
  union_org_id: string
  union_world_id: string
}
