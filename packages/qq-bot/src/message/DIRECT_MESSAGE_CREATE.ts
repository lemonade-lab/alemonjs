/**
 * 私信
 * @param event
 * @returns
 */
export type DIRECT_MESSAGE_CREATE_TYPE = {
  attachments?: {
    content_type: string;
    filename: string;
    height: number;
    id: string;
    size: number;
    url: string;
    width: number;
  }[];
  author: {
    avatar: string;
    bot: boolean;
    id: string;
    username: string;
  };
  channel_id: string;
  content: string;
  direct_message: boolean;
  guild_id: string;
  id: string;
  member: { joined_at: string };
  seq: number;
  seq_in_channel: string;
  src_guild_id: string;
  timestamp: string;
};
