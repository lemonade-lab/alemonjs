import { Result } from "../../common/result.js";
import { MemberInfo, PaginatedResult, PaginationParams } from "../../types/standard.js";
import { ActionContext, BlacklistMember, MessagingActionMap } from "../../types/messaging.js";
import "../../types/index.js";
import "../index.js";
import "./common.js";
//#region src/application/hooks/member.d.ts
/**
 * 成员管理
 * @param event 事件上下文
 */
declare const useMember: (event?: ActionContext) => readonly [{
  kickMany: (params: MessagingActionMap['member.kick.batch'][0]) => Promise<Result<{
    status: string;
    failedBlacklistIds: string[];
  }>>;
  blacklist: (params?: MessagingActionMap['member.blacklist.list'][0]) => Promise<Result<PaginatedResult<BlacklistMember>>>;
  updateBlacklist: (params: MessagingActionMap['member.blacklist.update'][0]) => Promise<Result<{
    failedUserIds: string[];
  }>>;
  muteMany: (params: MessagingActionMap['member.mute.batch'][0]) => Promise<Result<unknown>>;
  info: (params: {
    userId: string;
    guildId?: string;
  }) => Promise<Result<MemberInfo | null>>;
  information: (params: {
    userId: string;
  }) => Promise<Result<MemberInfo>>;
  list: (params?: {
    guildId?: string;
    pagination?: PaginationParams;
  }) => Promise<Result<PaginatedResult<MemberInfo>>>;
  kick: (params: {
    userId: string;
    guildId?: string;
  }) => Promise<Result>;
  ban: (params: {
    userId: string;
    guildId?: string;
    reason?: string;
    duration?: number;
  }) => Promise<Result>;
  unban: (params: {
    userId: string;
    guildId?: string;
  }) => Promise<Result>;
  search: (params: {
    keyword: string;
    guildId?: string;
    limit?: number;
  }) => Promise<Result>;
  /**
   * 禁言成员
   * @param userId 用户 ID
   * @param duration 禁言时长（秒），0 表示解除禁言
   * @param guildId 服务器 ID（不传则使用事件上下文）
   */
  mute(params: {
    userId: string;
    duration: number;
    guildId?: string;
  }): Promise<Result>;
  /**
   * 设置/取消管理员
   * @param userId 用户 ID
   * @param enable 是否设为管理员
   * @param guildId 服务器 ID（不传则使用事件上下文）
   */
  admin(params: {
    userId: string;
    enable: boolean;
    guildId?: string;
  }): Promise<Result>;
  /**
   * 设置成员名片/昵称
   * @param userId 用户 ID
   * @param card 名片内容，空字符串表示取消
   * @param guildId 服务器 ID（不传则使用事件上下文）
   */
  card(params: {
    userId: string;
    card: string;
    guildId?: string;
  }): Promise<Result>;
  /**
   * 设置成员专属头衔
   * @param userId 用户 ID
   * @param title 头衔内容
   * @param guildId 服务器 ID（不传则使用事件上下文）
   * @param duration 有效期（秒），-1 表示永久
   */
  title(params: {
    userId: string;
    title: string;
    guildId?: string;
    duration?: number;
  }): Promise<Result>;
}];
//#endregion
export { useMember };