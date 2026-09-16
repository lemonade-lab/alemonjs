// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
import type { ImClient } from '../im/index.js';

/** 待处理好友申请 */
export function getFriendRequests(client: ImClient) {
  return client.getFriendRequests();
}

/** 待处理入群申请 */
export function getGroupJoinRequests(client: ImClient, conversationShortId?: string) {
  return client.getGroupJoinRequests({ ...(conversationShortId ? { conversationShortId } : {}) });
}

/** 同意好友申请 */
export function approveFriend(client: ImClient, uid: string) {
  return client.approveFriend(uid);
}

/** 拒绝好友申请 */
export function rejectFriend(client: ImClient, uid: string) {
  return client.rejectFriend(uid);
}

/** 同意入群申请 */
export function approveGroupJoin(client: ImClient, requestId: string) {
  return client.approveGroupJoin(requestId);
}

/** 拒绝入群申请 */
export function rejectGroupJoin(client: ImClient, requestId: string) {
  return client.rejectGroupJoin(requestId);
}
