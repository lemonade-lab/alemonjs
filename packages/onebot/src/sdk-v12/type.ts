export type MESSAGES_TYPE = {
  detail_type: 'private' | 'group'
  user_id: string
  group_id: string
  group_name: string
  message_id: string
  raw_message: string
  platform: string
  sender: {
    nickname: string
  }
  message: any[]
}
