/**
 * 还有其他会话 把所有会话都集中到一个函数中
 */
import {
  FriendRequestEvent,
  GroupInviteEvent,
  GroupMessageEvent,
  PrivateMessageEvent,
  DiscussMessageEvent
} from 'icqq'

/**
 *
 *
 * message  GroupMessageEvent | PrivateMessageEvent | DiscussMessageEvent
 *
 * message.group  GroupMessageEvent
 *
 * request.friend  FriendRequestEvent
 *
 * request.group.invite GroupInviteEvent
 *
 * request.group.add  GroupRequestEvent
 *
 * @param event
 */

export async function callBack(
  event:
    | PrivateMessageEvent
    | DiscussMessageEvent
    | GroupMessageEvent
    | GroupInviteEvent
    | FriendRequestEvent
) {
  console.info(event)
}
