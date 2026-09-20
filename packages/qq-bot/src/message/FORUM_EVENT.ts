export type QQBotForumThread = { thread_id: string; title?: string; content?: string; datetime?: string };
export type QQBotForumPost = { post_id: string; content?: string; datetime?: string };
export type QQBotForumReply = { reply_id: string; content?: string; datetime?: string };

/** 私域论坛网关事件的公共字段。 */
export type FORUM_EVENT_TYPE = {
  guild_id: string;
  channel_id: string;
  author_id: string;
  thread_info?: QQBotForumThread;
  post_info?: QQBotForumPost;
  reply_info?: QQBotForumReply;
  audit_result?: { task_id?: string; result?: number; err_msg?: string };
};
