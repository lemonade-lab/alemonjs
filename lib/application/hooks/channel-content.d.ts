import { Result } from "../../common/result.js";
import { ActionContext } from "../../types/messaging.js";
import { EventKeys, Events } from "../../types/event/map.js";
import "../../types/index.js";
import "./common.js";
//#region src/application/hooks/channel-content.d.ts
/** Cross-platform scheduled channel content. */
declare const useSchedule: <T extends EventKeys>(event?: Events[T] | ActionContext) => readonly [{
  readonly list: (params?: {
    channelId?: string;
    since?: string;
  }) => Promise<Result<unknown>>;
  readonly get: (params: {
    scheduleId: string;
    channelId?: string;
  }) => Promise<Result<unknown>>;
  readonly create: (params: {
    schedule: Record<string, unknown>;
    channelId?: string;
  }) => Promise<Result<unknown>>;
  readonly update: (params: {
    scheduleId: string;
    schedule: Record<string, unknown>;
    channelId?: string;
  }) => Promise<Result<unknown>>;
  readonly remove: (params: {
    scheduleId: string;
    channelId?: string;
  }) => Promise<Result<unknown>>;
}];
/** Cross-platform forum/thread content. */
declare const useForum: <T extends EventKeys>(event?: Events[T] | ActionContext) => readonly [{
  readonly list: (params?: {
    channelId?: string;
  }) => Promise<Result<unknown>>;
  readonly get: (params: {
    threadId: string;
    channelId?: string;
  }) => Promise<Result<unknown>>;
  readonly create: (params: {
    title: string;
    content: string;
    format: 1 | 2 | 3 | 4;
    channelId?: string;
  }) => Promise<Result<unknown>>;
  readonly remove: (params: {
    threadId: string;
    channelId?: string;
  }) => Promise<Result<unknown>>;
}];
/** Cross-platform audio-channel controls. */
declare const useAudio: <T extends EventKeys>(event?: Events[T] | ActionContext) => readonly [{
  readonly control: (params: {
    status: 0 | 1 | 2 | 3;
    audioUrl?: string;
    text?: string;
    channelId?: string;
  }) => Promise<Result<unknown>>;
  readonly join: (params?: {
    channelId?: string;
  }) => Promise<Result<unknown>>;
  readonly leave: (params?: {
    channelId?: string;
  }) => Promise<Result<unknown>>;
  readonly online: (params?: {
    channelId?: string;
  }) => Promise<Result<unknown>>;
}];
/** Channel-scoped policy, authorization, direct-session and legacy-announcement controls. */
declare const useChannelSettings: <T extends EventKeys>(event?: Events[T] | ActionContext) => readonly [{
  readonly messageRate: (params?: {
    guildId?: string;
  }) => Promise<Result<unknown>>;
  readonly permissions: (params?: {
    guildId?: string;
  }) => Promise<Result<unknown>>;
  readonly requestPermission: (params: {
    channelId?: string;
    guildId?: string;
    path: string;
    method: string;
    description?: string;
  }) => Promise<Result<unknown>>;
  readonly openDirectSession: (params: {
    userId: string;
    sourceGuildId?: string;
  }) => Promise<Result<unknown>>;
  readonly setLegacyAnnouncement: (params: {
    messageId: string;
    channelId?: string;
  }) => Promise<Result<unknown>>;
  readonly removeLegacyAnnouncement: (params: {
    messageId: string;
    channelId?: string;
  }) => Promise<Result<unknown>>;
}];
//#endregion
export { useAudio, useChannelSettings, useForum, useSchedule };