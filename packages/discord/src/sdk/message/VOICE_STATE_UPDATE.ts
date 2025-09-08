/**
 * 音频状态更新
 */
export type VOICE_STATE_UPDATE_TYPE = {
  member: {
    user: {
      username: string;
      public_flags: number;
      id: string;
      global_name: string;
      display_name: string;
      discriminator: string;
      bot: boolean;
      avatar_decoration_data: any;
      avatar: string;
    };
    roles: string[];
    premium_since: null;
    pending: boolean;
    nick: null;
    mute: boolean;
    joined_at: string;
    flags: number;
    deaf: boolean;
    communication_disabled_until: null;
    avatar: string;
  };
  user_id: string;
  suppress: boolean;
  session_id: string;
  self_video: boolean;
  self_mute: true;
  self_deaf: boolean;
  request_to_speak_timestamp: null;
  mute: boolean;
  guild_id: string;
  deaf: boolean;
  channel_id: string;
};
