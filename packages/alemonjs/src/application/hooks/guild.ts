import { translate } from '../../common/i18n.js';
import type { ActionContext, MessagingActionMap } from '../../types';
import { createActionCaller, resolveActionContext, resolveActionTarget } from './action-context';
import { GuildInfo, Result, ResultCode, createResult, sendAction } from './common';

/**
 * 服务器/公会管理
 * @param event 事件上下文
 */
export const useGuild = (event?: ActionContext) => {
  const valueEvent = resolveActionContext(event);
  const call = createActionCaller(valueEvent);

  /**
   * 获取服务器信息
   * @param guildId 服务器 ID（不传则使用事件上下文）
   */
  const info = async (params?: { guildId?: string }): Promise<Result<GuildInfo | null>> => {
    const gid = params?.guildId || (valueEvent as any).GuildId;

    if (!gid) {
      return createResult(ResultCode.FailParams, translate('result.missing.guildid'), null);
    }
    try {
      const results = await sendAction({
        action: 'guild.info',
        payload: { event: valueEvent, BotId: valueEvent.BotId, target: resolveActionTarget(valueEvent), GuildId: gid }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      if (result) {
        return createResult(ResultCode.Ok, translate('result.successfully.retrieved.guild.info'), result.data ?? null);
      }

      return results[0] || createResult(ResultCode.Warn, translate('result.no.guild.info.found'), null);
    } catch {
      return createResult(ResultCode.Fail, translate('result.failed.to.get.guild.info'), null);
    }
  };

  /**
   * 获取 Bot 加入的服务器列表
   */
  const list = async (): Promise<Result<GuildInfo[]>> => {
    try {
      const results = await sendAction({
        action: 'guild.list',
        payload: { event: valueEvent, BotId: valueEvent.BotId, target: resolveActionTarget(valueEvent) }
      });
      const result = results.find(item => item.code === ResultCode.Ok);

      if (result) {
        return createResult(ResultCode.Ok, translate('result.successfully.retrieved.guild.list'), result.data ?? []);
      }

      return results[0] || createResult(ResultCode.Warn, translate('result.no.guild.list.found'), []);
    } catch {
      return createResult(ResultCode.Fail, translate('result.failed.to.get.guild.list'), []);
    }
  };

  const guild = {
    botInfo: (params: MessagingActionMap['guild.bot.info'][0] = {}) => call('guild.bot.info', params),
    muteState: (params: MessagingActionMap['guild.mute.get'][0] = {}) => call('guild.mute.get', params),
    info,
    list,

    /**
     * 更新服务器/群设置
     * @param params.name 新名称
     * @param guildId 服务器 ID（不传则使用事件上下文）
     */
    async update(params: { name?: string; guildId?: string }): Promise<Result> {
      const gid = params.guildId || (valueEvent as any).GuildId;

      if (!gid) {
        return createResult(ResultCode.FailParams, translate('result.missing.guildid'), null);
      }
      try {
        const results = await sendAction({
          action: 'guild.update',
          payload: { event: valueEvent, BotId: valueEvent.BotId, target: resolveActionTarget(valueEvent), GuildId: gid, params: { name: params.name } }
        });
        const result = results.find(item => item.code === ResultCode.Ok);

        return result || results[0] || createResult(ResultCode.Warn, translate('result.update.not.supported.or.failed'), null);
      } catch {
        return createResult(ResultCode.Fail, translate('result.failed.to.update.guild'), null);
      }
    },

    /**
     * 退出服务器/群
     * @param guildId 服务器 ID（不传则使用事件上下文）
     * @param isDismiss 是否解散（仅群主有效）
     */
    async leave(params?: { guildId?: string; isDismiss?: boolean }): Promise<Result> {
      const gid = params?.guildId || (valueEvent as any).GuildId;

      if (!gid) {
        return createResult(ResultCode.FailParams, translate('result.missing.guildid'), null);
      }
      try {
        const results = await sendAction({
          action: 'guild.leave',
          payload: {
            event: valueEvent,
            BotId: valueEvent.BotId,
            target: resolveActionTarget(valueEvent),
            GuildId: gid,
            params: { isDismiss: params?.isDismiss }
          }
        });
        const result = results.find(item => item.code === ResultCode.Ok);

        return result || results[0] || createResult(ResultCode.Warn, translate('result.leave.not.supported.or.failed'), null);
      } catch {
        return createResult(ResultCode.Fail, translate('result.failed.to.leave.guild'), null);
      }
    },

    /**
     * 全员禁言/解除全员禁言
     * @param enable 是否开启全员禁言
     * @param guildId 服务器 ID（不传则使用事件上下文）
     */
    async mute(params: { enable: boolean; guildId?: string }): Promise<Result> {
      const gid = params.guildId || (valueEvent as any).GuildId;

      if (!gid) {
        return createResult(ResultCode.FailParams, translate('result.missing.guildid'), null);
      }
      try {
        const results = await sendAction({
          action: 'guild.mute',
          payload: { event: valueEvent, BotId: valueEvent.BotId, target: resolveActionTarget(valueEvent), GuildId: gid, params: { enable: params.enable } }
        });
        const result = results.find(item => item.code === ResultCode.Ok);

        return result || results[0] || createResult(ResultCode.Warn, translate('result.mute.not.supported.or.failed'), null);
      } catch {
        return createResult(ResultCode.Fail, translate('result.failed.to.mute.guild'), null);
      }
    }
  };

  return [guild] as const;
};
