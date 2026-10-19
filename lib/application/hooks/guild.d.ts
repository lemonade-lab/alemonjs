import { Result } from "../../common/result.js";
import { GuildInfo } from "../../types/standard.js";
import { ActionContext, GuildBotState, GuildMuteState, MessagingActionMap } from "../../types/messaging.js";
import "../../types/index.js";
import "../index.js";
import "./common.js";
//#region src/application/hooks/guild.d.ts
/**
 * 服务器/公会管理
 * @param event 事件上下文
 */
declare const useGuild: (event?: ActionContext) => readonly [{
  botInfo: (params?: MessagingActionMap['guild.bot.info'][0]) => Promise<Result<GuildBotState>>;
  muteState: (params?: MessagingActionMap['guild.mute.get'][0]) => Promise<Result<GuildMuteState>>;
  info: (params?: {
    guildId?: string;
  }) => Promise<Result<GuildInfo | null>>;
  list: () => Promise<Result<GuildInfo[]>>;
  /**
   * 更新服务器/群设置
   * @param params.name 新名称
   * @param guildId 服务器 ID（不传则使用事件上下文）
   */
  update(params: {
    name?: string;
    guildId?: string;
  }): Promise<Result>;
  /**
   * 退出服务器/群
   * @param guildId 服务器 ID（不传则使用事件上下文）
   * @param isDismiss 是否解散（仅群主有效）
   */
  leave(params?: {
    guildId?: string;
    isDismiss?: boolean;
  }): Promise<Result>;
  /**
   * 全员禁言/解除全员禁言
   * @param enable 是否开启全员禁言
   * @param guildId 服务器 ID（不传则使用事件上下文）
   */
  mute(params: {
    enable: boolean;
    guildId?: string;
  }): Promise<Result>;
}];
//#endregion
export { useGuild };