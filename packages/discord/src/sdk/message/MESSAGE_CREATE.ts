/**
 * 基础消息
 * @param event
 */
export type MESSAGE_CREATE_TYPE = {
  type: number;
  tts: boolean;
  timestamp: string;
  referenced_message: null;
  pinned: boolean;
  nonce: string;
  mentions: {
    username: string;
    public_flags: number;
    member: any;
    id: string;
    global_name: null;
    discriminator: string;
    bot: boolean;
    avatar_decoration_data: null;
    avatar: string;
  }[];
  mention_roles: any[];
  mention_everyone: boolean;
  member: {
    roles: any[];
    premium_since: null;
    pending: boolean;
    nick: null;
    mute: boolean;
    joined_at: string;
    flags: number;
    deaf: boolean;
    communication_disabled_until: null;
    avatar: null;
  };
  id: string;
  flags: number;
  embeds: any[];
  edited_timestamp: null;
  content: string;
  components: any[];
  channel_id: string;
  author: {
    username: string;
    public_flags: number;
    premium_type: number;
    id: string;
    global_name: string;
    discriminator: string;
    avatar_decoration_data: null;
    avatar: string;
    bot?: boolean;
  };
  attachments: any[];
  guild_id: string;
};
