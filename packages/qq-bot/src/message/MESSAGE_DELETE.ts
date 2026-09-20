/**
 * *私域*
 */

/**
 * 删除（撤回）消息事件
 * @param event
 * @returns
 */
export type MESSAGE_DELETE_TYPE = {
  message: {
    id: string;
    channel_id: string;
    guild_id: string;
    author?: { id: string; username?: string; bot?: boolean };
  };
  op_user?: { id: string };
};
