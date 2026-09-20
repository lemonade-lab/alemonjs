import type { ActionContext } from '../../types';
import { EventKeys, Events, Result, ResultCode, createResult, sendAction } from './common';
import { resolveActionContext } from './action-context';

const action = async <T>(name: string, payload: object): Promise<Result<T>> => {
  const resource = payload as { ChannelId?: string; UserId?: string; target?: object };
  // Channel hooks may be used from a scheduled/proactive job, where no event
  // exists to infer a target. Preserve the standard target contract from IDs.
  const target =
    resource.target ??
    (resource.ChannelId
      ? { scope: 'channel' as const, targetId: resource.ChannelId }
      : resource.UserId
      ? { scope: 'direct' as const, targetId: resource.UserId }
      : undefined);
  const results = await sendAction({ action: name, payload: { ...payload, ...(target && { target }) } });
  const result = results.find(item => item.code === ResultCode.Ok);

  return result
    ? createResult(ResultCode.Ok, result.message, result.data as T)
    : createResult(ResultCode.Fail, results[0]?.message || `${name} failed`, null as T);
};

/** Cross-platform scheduled channel content. */
export const useSchedule = <T extends EventKeys>(event?: Events[T] | ActionContext) => {
  const value = resolveActionContext(event as ActionContext | undefined);
  const channelId = (id?: string) => id || (value as any).ChannelId;

  return [
    {
      list: (params: { channelId?: string; since?: string } = {}) => action('schedule.list', { ChannelId: channelId(params.channelId), params }),
      get: (params: { scheduleId: string; channelId?: string }) =>
        action('schedule.get', { ChannelId: channelId(params.channelId), ScheduleId: params.scheduleId }),
      create: (params: { schedule: Record<string, unknown>; channelId?: string }) =>
        action('schedule.create', { ChannelId: channelId(params.channelId), params }),
      update: (params: { scheduleId: string; schedule: Record<string, unknown>; channelId?: string }) =>
        action('schedule.update', { ChannelId: channelId(params.channelId), ScheduleId: params.scheduleId, params }),
      remove: (params: { scheduleId: string; channelId?: string }) =>
        action('schedule.delete', { ChannelId: channelId(params.channelId), ScheduleId: params.scheduleId })
    }
  ] as const;
};

/** Cross-platform forum/thread content. */
export const useForum = <T extends EventKeys>(event?: Events[T] | ActionContext) => {
  const value = resolveActionContext(event as ActionContext | undefined);
  const channelId = (id?: string) => id || (value as any).ChannelId;

  return [
    {
      list: (params: { channelId?: string } = {}) => action('forum.list', { ChannelId: channelId(params.channelId) }),
      get: (params: { threadId: string; channelId?: string }) => action('forum.get', { ChannelId: channelId(params.channelId), ThreadId: params.threadId }),
      create: (params: { title: string; content: string; format: 1 | 2 | 3 | 4; channelId?: string }) =>
        action('forum.create', { ChannelId: channelId(params.channelId), params }),
      remove: (params: { threadId: string; channelId?: string }) =>
        action('forum.delete', { ChannelId: channelId(params.channelId), ThreadId: params.threadId })
    }
  ] as const;
};

/** Cross-platform audio-channel controls. */
export const useAudio = <T extends EventKeys>(event?: Events[T] | ActionContext) => {
  const value = resolveActionContext(event as ActionContext | undefined);
  const channelId = (id?: string) => id || (value as any).ChannelId;

  return [
    {
      control: (params: { status: 0 | 1 | 2 | 3; audioUrl?: string; text?: string; channelId?: string }) =>
        action('audio.control', { ChannelId: channelId(params.channelId), params }),
      join: (params: { channelId?: string } = {}) => action('audio.join', { ChannelId: channelId(params.channelId) }),
      leave: (params: { channelId?: string } = {}) => action('audio.leave', { ChannelId: channelId(params.channelId) }),
      online: (params: { channelId?: string } = {}) => action('audio.online', { ChannelId: channelId(params.channelId) })
    }
  ] as const;
};

/** Channel-scoped policy, authorization, direct-session and legacy-announcement controls. */
export const useChannelSettings = <T extends EventKeys>(event?: Events[T] | ActionContext) => {
  const value = resolveActionContext(event as ActionContext | undefined);
  const guildId = (id?: string) => id || (value as any).GuildId;
  const channelId = (id?: string) => id || (value as any).ChannelId;

  return [
    {
      messageRate: (params: { guildId?: string } = {}) => action('channel.message-rate.get', { GuildId: guildId(params.guildId) }),
      permissions: (params: { guildId?: string } = {}) => action('channel.api-permission.list', { GuildId: guildId(params.guildId) }),
      requestPermission: (params: { channelId?: string; guildId?: string; path: string; method: string; description?: string }) =>
        action('channel.api-permission.request', { GuildId: guildId(params.guildId), ChannelId: channelId(params.channelId), params }),
      openDirectSession: (params: { userId: string; sourceGuildId?: string }) =>
        action('channel.direct-session.open', { UserId: params.userId, GuildId: params.sourceGuildId || guildId() }),
      setLegacyAnnouncement: (params: { messageId: string; channelId?: string }) =>
        action('channel.legacy-announcement.set', { ChannelId: channelId(params.channelId), MessageId: params.messageId }),
      removeLegacyAnnouncement: (params: { messageId: string; channelId?: string }) =>
        action('channel.legacy-announcement.remove', { ChannelId: channelId(params.channelId), MessageId: params.messageId })
    }
  ] as const;
};
