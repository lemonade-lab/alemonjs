/**
 * *
 * 私信
 * *
 */
export type DIRECT_MESSAGE_DELETE_TYPE = {
  message: {
    author: { bot: boolean; id: string; username: string };
    channel_id: string;
    direct_message: boolean;
    guild_id: string;
    id: string;
    src_guild_id: string;
  };
  op_user: { id: string };
};
