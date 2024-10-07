export type C2C_MESSAGE_CREATE_TYPE = {
  author: {
    id: string
    user_openid: string
  }
  content: string
  id: string
  timestamp: string
}

// user_avatar: `https://q.qlogo.cn/qqapp/${appID}/${event.author.id}/640`
