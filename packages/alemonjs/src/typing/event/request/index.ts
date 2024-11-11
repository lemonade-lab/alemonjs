import { Message } from '../base/message'
import { platform } from '../base/platform'
import { User } from '../base/user'
// 私有消息-朋友添加请求
export type PrivateEventRequestFriendAdd = platform & Message & User
// 私有消息-频道添加请求
export type PrivateEventRequestGuildAdd = platform & Message & User
