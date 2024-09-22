export interface USER_DATA {
  author: {
    id: string
    user_openid: string
  }
  content: string
  id: string
  timestamp: string
}

export interface GROUP_DATA {
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
