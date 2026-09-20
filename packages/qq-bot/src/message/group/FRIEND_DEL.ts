/**
 * 好友删除
 */
export type FRIEND_DEL_TYPE = {
  author?: { union_openid?: string };
  openid: string;
  timestamp: number | string;
};
