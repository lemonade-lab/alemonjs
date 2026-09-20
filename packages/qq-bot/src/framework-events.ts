import { getIdentity } from './config';
import type { User, EventsEnum, JoinRequestInfo, ReceivedMessage, MessageMediaItem, InteractionDetails } from 'alemonjs';

/** Preserve scoped identities in every author/mention, not only the top-level sender. */
export const normalizeMessageUser = (raw: any, scope: 'group' | 'c2c' | 'channel'): User => {
  const UserId = (scope === 'group' ? raw.member_openid : scope === 'c2c' ? raw.user_openid : raw.id) || raw.id || '';
  const [IsMaster, UserKey] = getIdentity(UserId);

  return {
    UserId,
    UserKey,
    IsMaster,
    UserName: raw.username,
    IsBot: raw.bot ?? false,
    SourceUserId: raw.id,
    DirectUserId: raw.user_openid,
    MemberId: raw.member_openid,
    UnionId: raw.union_openid,
    AccountId: raw.union_user_account,
    Role: raw.member_role
  };
};

export const normalizeJoinRequest = (raw: any, guildId = raw.group_openid): JoinRequestInfo => ({
  id: raw.join_request_id,
  guildId,
  userId: raw.member_openid,
  userName: raw.username,
  unionId: raw.union_openid,
  isBot: raw.bot,
  risk: raw.risk_tips,
  appliedAt: raw.apply_at,
  source: raw.apply_source,
  inviterId: raw.invited_by,
  verification: raw.verify_info && { method: raw.verify_info.method, message: raw.verify_info.verify_message, questions: raw.verify_info.review_qa_list },
  approvedByStrategyId: raw.auto_approved?.strategy_id
});
const context = (items: string[] = []) =>
  Object.fromEntries(
    items.map(item => {
      const at = item.indexOf('=');

      return at < 0 ? [item, ''] : [item.slice(0, at), item.slice(at + 1)];
    })
  );

export const normalizeAttachments = (attachments: any[] = []): MessageMediaItem[] =>
  attachments.map(item => ({
    Type:
      item.content_type === 'voice' || item.content_type?.startsWith('audio/')
        ? 'audio'
        : item.content_type?.startsWith('image/')
        ? 'image'
        : item.content_type?.startsWith('video/')
        ? 'video'
        : 'file',
    Url: item.url,
    FileId: item.id,
    FileName: item.filename,
    FileSize: item.size,
    MimeType: item.content_type,
    Width: item.width,
    Height: item.height,
    AudioUrl: item.voice_wav_url,
    Transcript: item.asr_refer_text
  }));
const message = (raw: any, scope: 'group' | 'c2c'): ReceivedMessage => {
  const ext = context(raw.message_scene?.ext);

  return {
    type: raw.message_type,
    referenceId: ext.msg_idx,
    replyReferenceId: ext.ref_msg_idx,
    source: raw.message_scene?.source,
    context: ext,
    card: raw.ark_data && { type: raw.ark_data.ark_type, name: raw.ark_data.ark_name, prompt: raw.ark_data.prompt, fields: raw.ark_data.fields },
    elements: raw.msg_elements?.map((item: any) => ({
      referenceId: item.msg_idx,
      userId: item.author ? normalizeMessageUser(item.author, scope).UserId : undefined,
      author: item.author && normalizeMessageUser(item.author, scope),
      userName: item.author?.username,
      text: item.content,
      content: message(item, scope),
      attachments: normalizeAttachments(item.attachments)
    }))
  };
};
const interactionTypes: Record<number, InteractionDetails['type']> = {
  11: 'button',
  12: 'menu',
  13: 'feedback',
  14: 'clear-session',
  15: 'story',
  16: 'model',
  18: 'authorization',
  19: 'authorization',
  20: 'authorization-status'
};

/** Standard fields expose platform capabilities without business code reading raw QQ data. */
export const normalizeFrameworkEvent = (event: EventsEnum, acknowledged = false): EventsEnum => {
  const raw = event.value;
  const tag = '_tag' in event ? String(event._tag) : '';

  if (!raw || typeof raw !== 'object') {
    return event;
  }
  const details: Record<string, unknown> = {};
  const timestamp = typeof raw.timestamp === 'number' ? raw.timestamp * 1000 : Date.parse(raw.timestamp);

  if (Number.isFinite(timestamp)) {
    details.OccurredAt = timestamp;
  }
  if (raw.author) {
    details.UnionId = raw.author.union_openid;
    details.AccountId = raw.author.union_user_account;
    details.Role = raw.author.member_role;
  }
  if (raw.group_openid) {
    details.Target = { scope: 'group', targetId: raw.group_openid, BotId: event.BotId };
  } else if (/^(C2C_|FRIEND_|SUBSCRIBE_MESSAGE_STATUS|INTERACTION_CREATE_C2C)/.test(tag)) {
    const id = raw.openid || raw.user_openid || raw.author?.user_openid || raw.author?.id;

    if (id) {
      details.Target = { scope: 'c2c', targetId: id, BotId: event.BotId };
    }
  }
  if (/^(GROUP_MESSAGE_CREATE|GROUP_AT_MESSAGE_CREATE|C2C_MESSAGE_CREATE)$/.test(tag)) {
    const scope = tag.startsWith('GROUP_') ? 'group' : 'c2c';

    if (raw.author) {
      Object.assign(details, normalizeMessageUser(raw.author, scope));
    }
    details.MessageContent = message(raw, scope);
    details.MessageMentions = raw.mentions?.map((item: any) => normalizeMessageUser(item, scope)) ?? [];
    details.MessageMedia = normalizeAttachments(raw.attachments);
  }
  if (tag === 'GROUP_MEMBER_ADD' || tag === 'GROUP_MEMBER_REMOVE') {
    details.MemberId = raw.member_openid;
    details.DirectUserId = raw.user_openid;
  }
  if (tag === 'GROUP_JOIN_REQUEST') {
    details.Notice = { type: 'join-request', request: normalizeJoinRequest(raw) };
  }
  if (tag === 'SUBSCRIBE_MESSAGE_STATUS') {
    details.Notice = {
      type: 'subscription',
      subscriptions: raw.result.map((r: any) => ({
        templateId: r.template_id,
        customTemplateId: r.custom_template_id,
        allowed: r.op === 1,
        subscriptionId: r.subscribe_id,
        subscribedAt: r.subscribe_ts,
        updatedAt: r.update_ts
      }))
    };
  }
  if (/^(C2C|GROUP)_MSG_(RECEIVE|REJECT)$/.test(tag)) {
    details.Notice = { type: 'message-permission', enabled: tag.endsWith('RECEIVE') };
  }
  if (tag === 'FRIEND_ADD' || tag === 'FRIEND_DEL') {
    details.FriendSource = { scene: raw.scene, data: raw.scene_param, code: raw.short_code, unionId: raw.author?.union_openid };
  }
  if (tag.startsWith('INTERACTION_CREATE')) {
    const r = raw.data?.resolved ?? {};

    details.EventId = raw.event_id || raw.id;
    details.Interaction = {
      type: interactionTypes[raw.type] ?? 'unknown',
      buttonId: r.button_id === undefined ? undefined : String(r.button_id),
      data: r.button_data,
      featureId: r.feature_id,
      messageId: r.message_id,
      feedback: r.feedback_opt === 'LIKE' ? 'like' : r.feedback_opt === 'UNLIKE' ? 'dislike' : undefined,
      checked: r.checked === undefined ? undefined : Boolean(r.checked),
      action: r.action,
      authorization: r.authorize_data && { scene: r.authorize_data.opt_scene, scope: r.authorize_data.scope },
      context: context(r.message_scene?.ext),
      requiresAck: raw.type === 11 || raw.type === 12,
      acknowledged
    };
  } else if (!tag.endsWith('MESSAGE_CREATE')) {
    details.EventId = raw.id;
  }

  return { ...event, ...details };
};
