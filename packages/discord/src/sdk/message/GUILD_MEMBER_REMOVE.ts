/**
 * 频道成员删除
 * @param event
 */
export type GUILD_MEMBER_REMOVE_TYPE = {
  user: {
    username: string;
    public_flags: number;
    id: string;
    global_name: string;
    discriminator: string;
    avatar_decoration_data: null;
    avatar: string;
  };
  guild_id: string;
};
