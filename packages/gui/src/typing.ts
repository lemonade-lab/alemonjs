import { MessageDataFormat } from 'alemonjs'

export type DataText = {
  t: 'Text'
  d: string
}

export type DataImage = {
  t: 'Image'
  d: {
    url_data?: string
    url_index?: string
  }
}

export type DataMention = {
  t: 'Mention'
  d: {
    id: string
    name: string
  }
}

export type User = {
  UserId: string
  UserName: string
  UserAvatar: string
  OpenId: string
  IsBot: boolean
}

export type Message = {
  createAt: number
  MessageId: number
  MessageBody: MessageDataFormat
} & User

export type PublicMessage = {
  GuildId: string
  ChannelId: string
} & Message

export type PrivateMessage = {} & Message

export type DataPrivate = {
  t: 'send_private_message'
  d: PrivateMessage
}

export type DataPublic = {
  t: 'send_message'
  d: PublicMessage
}

export type get_channel = {
  t: 'get_channel'
  d: {
    createAt: number
  }
}

export type get_private = {
  t: 'get_private'
  d: {
    createAt: number
  }
}

export type del_channel = {
  t: 'del_channel'
  d: {
    createAt: number
    MessageId: number
  }
}

export type del_private = {
  t: 'del_private'
  d: {
    createAt: number
    MessageId: number
  }
}

export type post_private = {
  t: 'post_private'
  d: DataPrivate[]
}

export type post_channel = {
  t: 'post_channel'
  d: DataPublic[]
}

export type Data =
  | DataPublic
  | DataPrivate
  | get_channel
  | get_private
  | del_channel
  | del_private
  | post_private
  | post_channel
