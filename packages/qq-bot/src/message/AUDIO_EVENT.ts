/** 音频机器人网关事件（AUDIO_START / FINISH / ON_MIC / OFF_MIC）。 */
export type AUDIO_EVENT_TYPE = {
  channel_id: string;
  guild_id?: string;
  audio_url?: string;
  text?: string;
  status?: 0 | 1 | 2 | 3;
  event_id?: string;
};

/** 音视频或直播子频道成员进出事件。 */
export type AUDIO_OR_LIVE_CHANNEL_MEMBER_EVENT_TYPE = {
  guild_id: string;
  channel_id: string;
  /** 2：音视频子频道；5：直播子频道。 */
  channel_type: 2 | 5;
  user_id: string;
};
