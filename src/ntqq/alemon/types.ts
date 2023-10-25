interface Author {
  id: string
  user_openid: string
}

export interface USER_DATA {
  author: Author
  content: string
  id: string
  timestamp: string
}

export interface GROUP_DATA {
  author: Author
  content: string
  group_id: string
  id: string
  timestamp: string
}
