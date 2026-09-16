// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
import { ActionResult, type ImClient, type ConversationAddress } from '../im/index.js';

/** 好友列表 */
export function getFriendList(client: ImClient) {
  return client.getFriendList();
}

/** 群列表 */
export function getGroupList(client: ImClient) {
  return client.getGroupList();
}

/** 群成员 */
export function getGroupMembers(client: ImClient, address: ConversationAddress) {
  return client.getGroupMembers(address);
}

/** 陌生人会话列表 */
export function getStrangerList(client: ImClient) {
  return client.getStrangerList();
}

export async function getGroupInfo(client: ImClient, id: string) {
  return (await client.getGroupList()).find(group => group.conversationId === id || group.conversationShortId === id || group.name === id);
}

export async function getGroupMemberInfo(client: ImClient, address: ConversationAddress, uid: string) {
  return (await client.getGroupMembers(address)).find(member => member.uid === uid);
}

export async function getStrangerInfo(client: ImClient, uid: string) {
  return (await client.getStrangerList()).find(user => user.uid === uid);
}

/** 依据好友 uid 解析会话地址（供发送/历史用） */
export async function resolveFriendAddress(client: ImClient, uid: string): Promise<ConversationAddress | undefined> {
  const list = await client.getFriendList();
  const friend = list.find(f => f.uid === uid || f.conversationShortId === uid);

  if (!friend) {
    return undefined;
  }

  return {
    conversationId: friend.conversationId,
    conversationShortId: friend.conversationShortId,
    conversationType: 1
  };
}

/** 依据群 id/名解析会话地址 */
export async function resolveGroupAddress(client: ImClient, id: string): Promise<ConversationAddress | undefined> {
  const list = await client.getGroupList();
  const group = list.find(g => g.conversationId === id || g.conversationShortId === id || g.name === id);

  if (!group) {
    return undefined;
  }

  return {
    conversationId: group.conversationId,
    conversationShortId: group.conversationShortId,
    conversationType: 2
  };
}

/** 设置群名（cmd=902） */
export function setGroupName(client: ImClient, address: ConversationAddress, name: string): Promise<ActionResult> {
  return client.setGroupName(address, name);
}
