import { GROUP_AT_MESSAGE_CREATE, C2C_MESSAGE_CREATE } from './sends';
import { createResult, ResultCode, type ActionTarget, type MenuItem, type CommandPanel, type OutgoingMessage } from 'alemonjs';
import type { ApiRequestData } from './sdk/typing';
import type { QQBotAPI } from './sdk/api';
import { getIdentity } from './config';
import { normalizeJoinRequest } from './framework-events';

const page = (items: unknown[], raw: any) => ({
  Items: items,
  NextCursor: raw.next_cursor,
  HasMore: raw.is_end === undefined ? Boolean(raw.next_cursor) : !raw.is_end
});
const pagination = (params: any) => ({ cursor: params?.Cursor ?? params?.After, limit: params?.Limit });
const memberIds = (ids: string[]): string[] => {
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > 20 || ids.some(id => typeof id !== 'string' || !id)) {
    throw new Error('Expected 1 to 20 non-empty member IDs');
  }

  return ids;
};
const nonEmptyIds = (ids: unknown, maximum: number, name: string): string[] => {
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > maximum || ids.some(id => typeof id !== 'string' || !id)) {
    throw new Error(`Expected 1 to ${maximum} non-empty ${name}`);
  }

  return ids;
};
const textLength = (value: string) => Buffer.byteLength(value, 'utf8');
const menuItem = (item: MenuItem, child = false): any => {
  const maximum = child ? 14 : 10;

  if (!item.name || textLength(item.name) > maximum) {
    throw new Error(`Menu item name must be at most ${maximum} bytes`);
  }
  if (child && item.type === 'menu') {
    throw new Error('Menu sub-items cannot contain another menu');
  }
  if (item.type === 'link' && !item.url.startsWith('https://')) {
    throw new Error('Menu links must use https');
  }
  if (item.type === 'menu' && (item.items.length < 1 || item.items.length > 5)) {
    throw new Error('A menu must contain 1 to 5 sub-items');
  }

  return {
    name: item.name,
    type: item.type === 'message' ? 'send_message' : item.type,
    ...('text' in item && { send_message: item.text }),
    ...('url' in item && { link: item.url }),
    ...('items' in item && { sub_menu_items: item.items.map(value => menuItem(value, true)) }),
    ...('id' in item && { switch: { switch_id: item.id, default: item.default } })
  };
};
const validatePanel = (panel: CommandPanel) => {
  if (panel.items.length > 20 || (panel.remark && textLength(panel.remark) > 255)) {
    throw new Error('Panel supports at most 20 items and a 255-byte remark');
  }
  for (const item of panel.items) {
    if (!item.name || textLength(item.name) > 14 || (item.description && textLength(item.description) > 30)) {
      throw new Error('Panel item name/description exceeds its limit');
    }
    if (item.type === 'link' && (!item.url || !item.url.startsWith('https://'))) {
      throw new Error('Panel link items require an https URL');
    }
  }
};
const validatePanelAudience = (scope: string, audience: string | undefined, userIds?: string[], guildIds?: string[]) => {
  if (!['group', 'c2c'].includes(scope)) {
    throw new Error('QQ panel scope must be group or c2c');
  }
  if (Boolean(userIds?.length) && Boolean(guildIds?.length)) {
    throw new Error('A panel audience cannot mix users and groups');
  }
  if (audience === 'specific') {
    const ids = scope === 'group' ? guildIds : userIds;
    nonEmptyIds(ids, 20, scope === 'group' ? 'group IDs' : 'user IDs');
  } else if (userIds?.length || guildIds?.length) {
    throw new Error('Panel audience IDs require audience: specific');
  }
  if ((scope === 'group' && userIds?.length) || (scope === 'c2c' && guildIds?.length)) {
    throw new Error('Panel audience IDs do not match its scope');
  }
};
const removal = (r: any) => ({ status: r.remove_members_result, failedBlacklistIds: r.add_to_member_blacklist_fail_openids ?? [] });
const blacklistResult = (r: any) => ({ failedUserIds: r.fail_openids ?? [] });
const operation = (value: 'add' | 'remove') => (value === 'remove' ? 'del' : 'add');
const mediaType = (value: string) => ({ image: 1, video: 2, audio: 3, file: 4 }[value] as 1 | 2 | 3 | 4);
const mediaReceipt = (r: any) => ({ fileId: r.file_info, uuid: r.file_uuid, ttl: r.ttl, messageId: r.id, url: r.raw_url });
const receipt = (r: any) => ({ id: r.id, timestamp: r.timestamp, referenceId: r.ext_info?.ref_idx });
const policy = (r: any) => ({
  id: r.strategy_id,
  guildIds: r.group_openids,
  guildNumbers: r.group_ids,
  enabled: r.is_enable === 'on',
  expiresAt: r.expire_at,
  remark: r.remark,
  whitelistCount: r.whitelist_user_count,
  createdAt: r.created_at,
  updatedAt: r.updated_at
});
const policyBody = (p: any) => ({
  group_openids: p.guildIds,
  group_ids: p.guildNumbers,
  is_enable: p.enabled === undefined ? undefined : p.enabled ? ('on' as const) : ('off' as const),
  expire_at: p.expiresAt,
  remark: p.remark
});
const fromMenuItem = (item: any): MenuItem =>
  ({
    name: item.name,
    ...(item.type === 'send_message'
      ? { type: 'message', text: item.send_message }
      : item.type === 'switch'
      ? { type: 'switch', id: item.switch?.switch_id, default: item.switch?.default }
      : item.type === 'menu'
      ? { type: 'menu', items: item.sub_menu_items?.map(fromMenuItem) ?? [] }
      : { type: 'link', url: item.link })
  } as MenuItem);
const panelBody = (panel: CommandPanel) => ({
  items: panel.items.map(item => ({ name: item.name, desc: item.description, type: item.type, only_admin: item.adminOnly, link: item.url })),
  remark: panel.remark,
  version: panel.version
});
const fromPanel = (r: any) => {
  if (!['group', 'c2c'].includes(r.scope)) {
    throw new Error(`QQ panel scope ${r.scope || 'unknown'} is outside the non-channel framework surface`);
  }

  return {
    id: r.panel_id,
    scope: r.scope as 'group' | 'c2c',
    audience: r.target_type,
    userIds: r.user_openids,
    guildIds: r.group_openids,
    version: r.version,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    panel: {
      items: (r.panel?.items ?? []).map((item: any) => ({
        name: item.name,
        description: item.desc,
        type: item.type,
        adminOnly: item.only_admin,
        url: item.link
      })),
      remark: r.panel?.remark,
      version: r.panel?.version
    }
  };
};
const member = (r: any, guildId: string) => {
  const [IsMaster, UserKey] = getIdentity(r.member_openid);

  return {
    UserId: r.member_openid,
    UserName: r.username,
    UserKey,
    IsMaster,
    IsBot: r.bot ?? false,
    GuildId: guildId,
    Role: r.member_role,
    Roles: r.member_role ? [r.member_role] : [],
    UnionId: r.union_openid,
    JoinedAt: r.joined_at ? Date.parse(r.joined_at) : undefined
  };
};

export const toQQMessage = (content: OutgoingMessage) => {
  if ([content.markdown, content.media, content.card].filter(Boolean).length > 1) {
    throw new Error('markdown, media and card are mutually exclusive message bodies');
  }
  if (content.keyboard?.templateId && content.keyboard.rows) {
    throw new Error('keyboard templateId and rows are mutually exclusive');
  }

  return {
    msg_type: content.markdown ? (2 as const) : content.media ? (7 as const) : content.card ? (3 as const) : (0 as const),
    content: content.markdown ? undefined : content.text,
    markdown: content.markdown && {
      content: content.markdown.content,
      custom_template_id: content.markdown.templateId,
      template_id: content.markdown.legacyTemplateId,
      params: content.markdown.params,
      force_verify_image_resource: content.markdown.verifyImages
    },
    media: content.media && { file_info: content.media.fileId },
    ark: content.card && {
      template_id: content.card.templateId,
      kv: content.card.fields.map(field => ({ key: field.key, value: field.value, obj: field.objects?.map(object => ({ obj_kv: object.fields })) }))
    },
    keyboard: content.keyboard && {
      id: content.keyboard.templateId,
      content: content.keyboard.rows && {
        rows: content.keyboard.rows.map(buttons => ({
          buttons: buttons.map(button => ({
            id: button.id,
            group_id: button.groupId,
            render_data: { label: button.label, visited_label: button.visitedLabel ?? button.label, style: button.style },
            action: {
              type: { link: 0, callback: 1, command: 2 }[button.action.type],
              data: button.action.data,
              permission: {
                type: { users: 0, admins: 1, everyone: 2, roles: 3 }[button.action.permission?.type ?? 'everyone'],
                specify_user_ids: button.action.permission?.userIds,
                specify_role_ids: button.action.permission?.roleIds
              },
              enter: button.action.autoSend,
              reply: button.action.reply,
              unsupport_tips: button.action.hint,
              anchor: button.action.anchor,
              click_limit: button.action.clickLimit,
              modal: button.action.modal && {
                content: button.action.modal.content,
                confirm_text: button.action.modal.confirmText,
                cancel_text: button.action.modal.cancelText
              }
            }
          }))
        }))
      }
    }
  };
};

/** Translate semantic framework actions. Undefined means a legacy/channel action. */
export const handleFrameworkAction = async (client: QQBotAPI, data: { action: string; payload: any }, botId: string) => {
  const payload = data.payload ?? {};
  const p = payload.params ?? {};
  const event = payload.event ?? {};
  const target: ActionTarget | undefined =
    p.target ??
    payload.target ??
    event.Target ??
    (event.SpaceId?.startsWith('GROUP:')
      ? { scope: 'group', targetId: event.ChannelId || event.GuildId }
      : event.SpaceId?.startsWith('GUILD:')
      ? { scope: 'channel', targetId: event.ChannelId || event.SpaceId.slice(6) }
      : event.IsPrivate && event.UserId
      ? { scope: 'c2c', targetId: event.UserId }
      : undefined);
  const groupId = p.guildId ?? payload.GuildId ?? (target?.scope === 'group' ? target.targetId : undefined) ?? event.GuildId ?? event.ChannelId;
  const userId = p.userId ?? payload.UserId ?? event.UserId;
  const need = (value: string | undefined, name: string) => {
    if (!value) {
      throw new Error(`Missing ${name}`);
    }

    return value;
  };
  const requireGroup = () => {
    if (target?.scope !== 'group') {
      throw new Error('This operation requires an explicit group target');
    }

    return need(groupId, 'guildId');
  };
  const destination = () => {
    if (!target || !['group', 'c2c'].includes(target.scope) || !target.targetId) {
      throw new Error('A group or c2c target is required');
    }

    return target;
  };
  const delivery = (): Pick<ApiRequestData, 'msg_id' | 'event_id' | 'is_wakeup' | 'msg_seq' | 'message_reference'> => {
    if (p.wakeup && (p.replyId || p.eventId)) {
      throw new Error('wakeup cannot be combined with replyId/eventId');
    }
    if (p.replyId && p.eventId) {
      throw new Error('replyId and eventId are mutually exclusive');
    }
    if (p.wakeup && target?.scope === 'group') {
      throw new Error('QQ wakeup messages require a c2c target');
    }
    const origin =
      event.Target ??
      (event.SpaceId?.startsWith('GROUP:')
        ? { scope: 'group', targetId: event.SpaceId.slice(6) }
        : event.IsPrivate && event.UserId
        ? { scope: 'c2c', targetId: event.UserId }
        : undefined);
    const sameBot = !(origin?.BotId ?? event.BotId) || (origin?.BotId ?? event.BotId) === botId;
    const sameConversation = sameBot && (!origin || !target || (origin.scope === target.scope && origin.targetId === target.targetId));
    const eventReply = sameConversation && /^(INTERACTION_CREATE|GROUP_ADD_ROBOT|GROUP_MSG_RECEIVE|C2C_MSG_RECEIVE|FRIEND_ADD)/.test(event._tag ?? '');
    const messageReply = sameConversation && /^(GROUP_AT_MESSAGE_CREATE|GROUP_MESSAGE_CREATE|C2C_MESSAGE_CREATE)$/.test(event._tag ?? '');

    return {
      ...(p.wakeup
        ? { is_wakeup: true }
        : p.eventId
        ? { event_id: p.eventId }
        : p.replyId
        ? { msg_id: p.replyId }
        : eventReply
        ? { event_id: event.EventId ?? event.MessageId }
        : messageReply
        ? { msg_id: event.MessageId }
        : {}),
      ...(p.sequence !== undefined && { msg_seq: p.sequence }),
      ...(p.referenceId && { message_reference: { message_id: p.referenceId } })
    };
  };
  const actions: Record<string, () => Promise<unknown>> = {
    'menu.get': async () => {
      const r = await client.menuGet();

      return { version: r.version, menu: r.menu && { items: (r.menu.items ?? []).map(fromMenuItem) } };
    },
    'menu.set': () => {
      if (!Array.isArray(p.menu?.items) || p.menu.items.length > 10) {
        throw new Error('A QQ menu supports at most 10 items');
      }

      return client.menuPut({ menu: { items: p.menu.items.map(menuItem) } });
    },
    'panel.list': async () => {
      if (!['group', 'c2c'].includes(p.scope)) {
        throw new Error('QQ panel scope must be group or c2c');
      }
      const r = await client.panelsList({ scope: p.scope, ...pagination(p.pagination) });

      return page(r.records.map(fromPanel), r);
    },
    'panel.create': async () => {
      validatePanel(p.panel);
      validatePanelAudience(p.scope, p.audience, p.userIds, p.guildIds);
      const r = await client.panelsCreate({
        scope: p.scope,
        target_type: p.audience,
        user_openids: p.userIds,
        group_openids: p.guildIds,
        panel: panelBody(p.panel)
      });

      return { id: r.panel_id };
    },
    'panel.get': async () => fromPanel(await client.panelsGet(need(p.id, 'id'))),
    'panel.update': () => {
      validatePanel(p.panel);

      return client.panelsPut(need(p.id, 'id'), { panel: panelBody(p.panel) });
    },
    'panel.delete': () => client.panelsDelete(need(p.id, 'id')),
    'panel.targets.update': () => {
      if (!p.userIds?.length && !p.guildIds?.length) {
        throw new Error('Update at least one panel audience');
      }
      if (p.userIds) {
        nonEmptyIds(p.userIds, 20, 'user IDs');
      }
      if (p.guildIds) {
        nonEmptyIds(p.guildIds, 20, 'group IDs');
      }

      return client.panelsTargetPut(need(p.id, 'id'), { op: operation(p.operation), user_openids: p.userIds, group_openids: p.guildIds });
    },
    'me.share': async () => (await client.generateUrlLink({ callback_data: p.data })).data,
    'connection.gateway': () => client.gateway(),
    'guild.bot.info': async () => {
      const r = await client.groupsBotState(requireGroup());

      return {
        userId: r.member_openid,
        joinedAt: r.joined_at,
        role: r.member_role,
        allowsProactiveMessages: r.allow_proactive_msg,
        receiveMode: r.recv_msg_setting
      };
    },
    'guild.mute.get': async () => {
      const r = await client.groupsRestrictChatSetting(requireGroup());
      const rule = r.global_rule;

      return {
        global: rule && {
          mode: rule.mode,
          schedules: rule.schedule_rules?.map((s: any) => ({ id: s.task_id, start: s.start_at, end: s.end_at, enabled: s.enabled })),
          recurring: rule.recurring_rules?.map((s: any) => ({ id: s.task_id, weekdays: s.weekdays, start: s.start_time, end: s.end_time, enabled: s.enabled }))
        },
        members: (r.members ?? []).map((m: any) => ({ userId: m.member_openid, userName: m.username, unionId: m.union_openid, expiresAt: m.mute_expire_at }))
      };
    },
    'member.kick.batch': async () => {
      const r = await client.groupsBatchRemoveMembers(requireGroup(), { member_openids: memberIds(p.userIds), add_to_member_blacklist: p.blacklist });

      return removal(r);
    },
    'member.blacklist.list': async () => {
      const r = await client.groupsMemberBlacklist(requireGroup(), pagination(p.pagination));

      return page(
        r.users.map(m => ({ userId: m.member_openid, userName: m.username, unionId: m.union_openid, isBot: m.bot, bannedAt: m.banned_at })),
        r
      );
    },
    'member.blacklist.update': async () => {
      const r = await client.groupsMemberBlacklistPost(requireGroup(), { op: operation(p.operation), member_openids: memberIds(p.userIds) });

      return blacklistResult(r);
    },
    'member.mute.batch': () =>
      client.groupsRestrictChatSettingPost(requireGroup(), {
        members: nonEmptyIds(
          p.members?.map((m: any) => m.userId),
          20,
          'member IDs'
        ).map((userId, index) => {
          const member = p.members[index];

          return { op: member.operation === 'remove' ? 'del' : member.operation, member_openid: userId, mute_expire_at: member.expiresAt };
        })
      }),
    'request.guild.list': async () => {
      const id = requireGroup();
      const r = await client.groupsJoinRequestList(id, pagination(p.pagination));

      return page(
        (r.list ?? []).map((item: any) => normalizeJoinRequest(item, id)),
        r
      );
    },
    'request.guild.decide': () =>
      client.groupsApprovalJoinRequest(requireGroup(), need(p.userId, 'userId'), {
        op: p.approve ? 'approve' : 'decline',
        join_request_id: p.requestId,
        reject_reason: p.reason,
        add_to_member_blacklist: p.blacklist
      }),
    'request.policy.list': async () => {
      const r = await client.groupsJoinApprovalStrategies(pagination(p.pagination));

      return page((r.strategies ?? []).map(policy), r);
    },
    'request.policy.create': async () => {
      if (Boolean(p.guildIds) === Boolean(p.guildNumbers)) {
        throw new Error('Provide exactly one of guildIds or guildNumbers');
      }
      const ids = p.guildIds ?? p.guildNumbers;

      if (!Array.isArray(ids) || ids.length < 1 || ids.length > 100) {
        throw new Error('Expected 1 to 100 groups');
      }

      return policy(await client.groupsJoinApprovalStrategyCreate(policyBody(p)));
    },
    'request.policy.update': async () => {
      if (p.guilds && Boolean(p.guilds.ids?.length) === Boolean(p.guilds.numbers?.length)) {
        throw new Error('Policy group updates require exactly one of ids or numbers');
      }
      if (p.guilds?.ids) {
        nonEmptyIds(p.guilds.ids, 100, 'group IDs');
      }
      if (p.guilds?.numbers) {
        nonEmptyIds(p.guilds.numbers, 100, 'group numbers');
      }
      const r = await client.groupsJoinApprovalStrategyPatch(need(p.id, 'id'), {
        ...policyBody(p),
        group_action: p.guilds && { op: operation(p.guilds.operation), group_openids: p.guilds.ids, group_ids: p.guilds.numbers }
      });

      return { enabled: r.is_enable === undefined ? undefined : r.is_enable === 'on', expiresAt: r.expire_at };
    },
    'request.policy.delete': () => client.groupsJoinApprovalStrategyDelete(need(p.id, 'id')),
    'request.policy.execute': () => client.groupsJoinApprovalStrategyExecute(need(p.id, 'id')),
    'request.policy.whitelist': async () => {
      const r = await client.groupsJoinApprovalStrategyWhitelistUsers(need(p.id, 'id'), {
        op: operation(p.operation),
        whitelist_users: nonEmptyIds(p.userIds, 10000, 'whitelist user IDs')
      });

      return { id: r.strategy_id, whitelistCount: r.whitelist_user_count, updatedAt: r.updated_at };
    },
    'message.typing': async () => {
      const t = destination();

      if (t.scope !== 'c2c') {
        throw new Error('QQ typing is only available in c2c');
      }
      if (p.duration !== undefined && (!Number.isInteger(p.duration) || p.duration < 1 || p.duration > 60)) {
        throw new Error('QQ typing duration must be an integer from 1 to 60 seconds');
      }

      return receipt(
        await client.usersOpenMessages(t.targetId, { msg_type: 6, input_notify: { input_type: 1, input_second: p.duration ?? 60 }, ...delivery() })
      );
    },
    'message.stream': async () => {
      const t = destination();

      if (t.scope !== 'c2c') {
        throw new Error('QQ streaming is only available in c2c');
      }
      if (!p.text || !Number.isInteger(p.index) || p.index < 0) {
        throw new Error('QQ streaming requires non-empty text and a non-negative integer index');
      }
      const r = await client.streamMessages(t.targetId, {
        ...delivery(),
        input_mode: p.mode,
        input_state: p.state === 'complete' ? 10 : 1,
        content_type: p.contentType,
        content_raw: p.text,
        index: p.index,
        stream_msg_id: p.streamId
      });

      return { ...receipt(r), remainingLength: r.remain_msg_len };
    },
    'media.prepare': async () => {
      const t = destination();
      const body = { file_type: mediaType(p.type), file_name: p.name, file_size: p.size, md5: p.hashes.md5, sha1: p.hashes.sha1, md5_10m: p.hashes.headMd5 };
      const r = await (t.scope === 'group' ? client.groupUploadPrepare(t.targetId, body) : client.usersUploadPrepare(t.targetId, body));

      return {
        id: r.upload_id,
        blockSize: r.block_size,
        parts: r.parts.map((part: any) => ({ index: part.index, url: part.presigned_url, size: part.block_size })),
        config: { concurrency: r.upload_config.concurrency, retryTimeout: r.upload_config.retry_timeout, retryDelay: r.upload_config.retry_delay }
      };
    },
    'media.part.finish': () => {
      const t = destination();
      const body = { upload_id: p.uploadId, part_index: p.index, block_size: p.size, md5: p.md5 };

      return t.scope === 'group' ? client.groupUploadPartFinish(t.targetId, body) : client.usersUploadPartFinish(t.targetId, body);
    },
    'media.complete': async () => {
      const t = destination();
      const body = { upload_id: p.uploadId, file_type: mediaType(p.type), file_name: p.name, srv_send_msg: p.send ?? false };

      return mediaReceipt(await (t.scope === 'group' ? client.postRichMediaByGroup(t.targetId, body) : client.postRichMediaByUser(t.targetId, body)));
    }
  };

  if (target?.scope === 'group') {
    Object.assign(actions, {
      'guild.info': async () => {
        const r = await client.groupsInfo(requireGroup());

        return {
          GuildId: r.group_openid,
          GuildName: r.group_name,
          Description: r.group_finger_memo,
          Category: r.group_class_text,
          Tags: r.group_tags,
          MemberCount: r.group_member_num
        };
      },
      'member.info': async () => member(await client.groupsMembersMessage(requireGroup(), need(userId, 'userId')), requireGroup()),
      'member.list': async () => {
        const id = requireGroup();
        const r = await client.groupsMembers(id, { cursor: pagination(p).cursor });

        return page(
          r.members.map(item => member(item, id)),
          r
        );
      },
      'member.kick': async () => removal(await client.groupsBatchRemoveMembers(requireGroup(), { member_openids: [need(userId, 'userId')] })),
      'member.ban': async () =>
        removal(await client.groupsBatchRemoveMembers(requireGroup(), { member_openids: [need(userId, 'userId')], add_to_member_blacklist: true })),
      'member.unban': async () =>
        blacklistResult(await client.groupsMemberBlacklistPost(requireGroup(), { op: 'del', member_openids: [need(userId, 'userId')] })),
      'member.mute': () =>
        client.groupsRestrictChatSettingPost(requireGroup(), {
          members: [
            {
              member_openid: need(userId, 'userId'),
              op: p.duration === 0 ? 'del' : 'add',
              mute_expire_at: p.duration === 0 ? '' : new Date(Date.now() + p.duration * 1000).toISOString()
            }
          ]
        }),
      'guild.mute': () => {
        throw new Error('QQ group API supports member muting, not setting global mute rules');
      }
    });
  }
  if (data.action === 'message.send' && p.content) {
    actions['message.send'] = async () => {
      const t = destination();
      const body = { ...toQQMessage(p.content), ...delivery() };

      return receipt(await (t.scope === 'group' ? client.groupOpenMessages(t.targetId, body) : client.usersOpenMessages(t.targetId, body)));
    };
  }
  if (data.action === 'message.delete' && target && ['group', 'c2c'].includes(target.scope)) {
    actions['message.delete'] = () =>
      target.scope === 'group'
        ? client.groupMessageDelete(target.targetId, need(payload.MessageId, 'MessageId'))
        : client.userMessageDelete(target.targetId, need(payload.MessageId, 'MessageId'));
  }
  if (data.action === 'message.send' && p.format && target && ['group', 'c2c'].includes(target.scope)) {
    const requestedBot = target.BotId ?? payload.BotId ?? event.BotId;

    if (requestedBot && requestedBot !== botId) {
      return [createResult(ResultCode.FailParams, 'BotId does not match this adapter', null)];
    }
    try {
      const d = delivery();
      const options = { ...p, replyId: d.msg_id, eventId: d.event_id, wakeup: d.is_wakeup };

      return target.scope === 'group'
        ? await GROUP_AT_MESSAGE_CREATE(client, { ChannelId: target.targetId }, p.format, options)
        : await C2C_MESSAGE_CREATE(client, { UserId: target.targetId }, p.format, options);
    } catch (error) {
      return [createResult(ResultCode.Fail, data.action, error?.response?.data ?? error?.message ?? error)];
    }
  }
  const action = actions[data.action];

  if (!action) {
    const guildOperation = /^(guild|member|role)\./.test(data.action) || data.action === 'me.guilds';
    // An empty event object is the intentional proactive context used by
    // framework hooks. Only a real ambiguous source event must be rejected.
    const hasSourceEvent = Boolean(payload.event && Object.keys(payload.event).length > 0);

    if (guildOperation && (target?.scope === 'group' || target?.scope === 'c2c' || (!target && hasSourceEvent))) {
      return [
        createResult(
          target ? ResultCode.Fail : ResultCode.FailParams,
          target ? `${data.action} is not supported for QQ ${target.scope}` : `${data.action} requires an explicit target scope`,
          null
        )
      ];
    }
    // Only endpoints below /channels/{channel_id} need a channel target.
    // Guild/member/role operations are scoped by GuildId and must work in
    // proactive jobs that intentionally have no source channel.
    const requiresChannelTarget =
      /^(permission|reaction|schedule|forum|audio)\./.test(data.action) ||
      /^channel\.(info|update|delete|legacy-announcement\.|api-permission\.request)/.test(data.action) ||
      /^message\.(get|edit|pin|unpin)$/.test(data.action);

    if (requiresChannelTarget && target?.scope !== 'channel' && target?.scope !== 'direct') {
      return [
        createResult(
          target ? ResultCode.Fail : ResultCode.FailParams,
          target ? `${data.action} is not supported for QQ ${target.scope}` : `${data.action} requires an explicit target scope`,
          null
        )
      ];
    }

    return undefined;
  }
  if ((target?.BotId ?? payload.BotId ?? event.BotId) && (target?.BotId ?? payload.BotId ?? event.BotId) !== botId) {
    return [createResult(ResultCode.FailParams, 'BotId does not match this adapter', null)];
  }
  try {
    const result = await action();

    if (['member.kick', 'member.ban', 'member.kick.batch', 'member.unban', 'member.blacklist.update'].includes(data.action)) {
      const outcome = result as { status?: string; failedBlacklistIds?: string[]; failedUserIds?: string[] };

      if ((outcome.status !== undefined && outcome.status !== 'success') || outcome.failedBlacklistIds?.length || outcome.failedUserIds?.length) {
        return [createResult(ResultCode.Warn, `${data.action}: some operations failed; inspect result data`, result)];
      }
    }

    return [createResult(ResultCode.Ok, data.action, result)];
  } catch (error) {
    return [createResult(ResultCode.Fail, data.action, error?.response?.data ?? error?.message ?? error)];
  }
};
