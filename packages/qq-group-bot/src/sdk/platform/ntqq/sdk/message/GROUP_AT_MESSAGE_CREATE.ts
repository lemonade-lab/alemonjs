export interface GROUP_AT_MESSAGE_CREATE_TYPE {
  author: {
    id: string
    member_openid: string
  }
  content: string
  group_openid: string
  group_id: string
  id: string
  timestamp: string
}

// https://q.qlogo.cn/qqapp/${appId}/${event.author.id}/640
