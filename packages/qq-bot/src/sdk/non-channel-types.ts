/** 群聊、单聊服务端接口模型，依据 docs/official/non-channel 快照。 */
export type QQBotPage = { cursor?: string; limit?: number };
export type QQBotMenuItem = {
  name?: string;
  type?: 'switch' | 'send_message' | 'link' | 'menu';
  send_message?: string;
  link?: string;
  switch?: { switch_id?: string; default?: boolean };
  sub_menu_items?: { name?: string; type?: 'send_message' | 'link'; send_message?: string; link?: string }[];
};
export type QQBotMenu = { items?: QQBotMenuItem[] };
export type QQBotPanel = {
  items?: { name?: string; desc?: string; type?: 'command' | 'link'; only_admin?: boolean; link?: string }[];
  remark?: string;
  version?: number;
};
/** 本次仅开放非频道场景。 */
export type QQBotPanelScope = 'c2c' | 'group';
export type QQBotPanelCreate = {
  scope: QQBotPanelScope;
  target_type?: 'all' | 'specific';
  user_openids?: string[];
  group_openids?: string[];
  panel: QQBotPanel;
};
export type QQBotPanelRecord = QQBotPanelCreate & {
  panel_id: string;
  created_at?: string;
  updated_at?: string;
  version?: number;
};
export type QQBotGroupMember = {
  member_openid: string;
  username: string;
  member_role: 'member' | 'owner' | 'admin';
  bot: boolean;
  joined_at: string;
  union_openid?: string;
};
export type QQBotBlacklistUser = {
  member_openid: string;
  username: string;
  banned_at: string;
  bot: boolean;
  union_openid?: string;
};
export type QQBotMessageResult = { id: string; timestamp: string; ext_info?: { ref_idx?: string } };

export type QQBotMessageUser = {
  id: string;
  username?: string;
  bot?: boolean;
  union_openid?: string;
  union_user_account?: string;
  user_openid?: string;
  member_openid?: string;
  member_role?: 'member' | 'admin' | 'owner';
};
export type QQBotAttachment = {
  id?: string;
  url?: string;
  filename?: string;
  width?: number;
  height?: number;
  size?: number;
  content_type?: string;
  voice_wav_url?: string;
  asr_refer_text?: string;
};
export type QQBotArkData = { prompt?: string; ark_type?: string; ark_name?: string; fields?: Record<string, unknown> };
export type QQBotMessageElement = {
  msg_idx?: string;
  author?: QQBotMessageUser;
  message_type?: number;
  content?: string;
  attachments?: QQBotAttachment[];
  ark_data?: QQBotArkData;
  msg_elements?: QQBotMessageElement[];
};
export type QQBotMessageContent = {
  attachments?: QQBotAttachment[];
  ark_data?: QQBotArkData;
  msg_elements?: QQBotMessageElement[];
  message_scene?: { ext: string[]; source?: string };
  message_type?: number;
};
export type QQBotInteractionResolved = {
  button_data?: string;
  button_id?: string | number;
  user_id?: string;
  feature_id?: string;
  message_id?: string;
  feedback_opt?: 'LIKE' | 'UNLIKE';
  checked?: number;
  action?: string;
  message_scene?: { ext?: string[] };
  authorize_data?: { opt_scene?: string; scope?: string };
};
