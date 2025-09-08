/**
 * 公域
 * @param event
 */
export type PUBLIC_MESSAGE_DELETE_TYPE = {
  message: {
    author: { bot: false; id: string; username: string };
    channel_id: string;
    guild_id: string;
    id: string;
  };
  op_user: { id: string };
};
