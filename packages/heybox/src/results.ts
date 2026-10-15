const platform = 'heybox';

import { createUserHashKey, isMaster } from 'alemonjs/common';

/** SDK data objects can hold private HTTP clients containing credentials. */
export function publicValue(value: any, seen = new WeakSet<object>()): any {
  if (value === null || typeof value !== 'object') {
    return typeof value === 'bigint' ? String(value) : value;
  }
  if (Buffer.isBuffer(value)) {
    return value.toJSON();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (seen.has(value)) {
    return undefined;
  }
  seen.add(value);
  const rawSymbol = Object.getOwnPropertySymbols(value).find(symbol => symbol.description === 'twurpleRawData');
  let result;

  if (rawSymbol) {
    result = publicValue(value[rawSymbol], seen);
  } else if (Array.isArray(value)) {
    result = value.map(item => publicValue(item, seen));
  } else {
    result = Object.fromEntries(
      Object.entries(value)
        .filter(([key, item]) => !['_client', '_http', 'authProvider'].includes(key) && typeof item !== 'function')
        .map(([key, item]) => [key, publicValue(item, seen)])
    );
  }
  seen.delete(value);

  return result;
}

/** Native SDK responses stay available in value; framework hooks receive standard IDs. */
export function standardResult(action: string, result: any, payload: any = {}) {
  if (
    result === null ||
    result === undefined ||
    !/^(me\.(info|friends|guilds|threads)|user\.info|member\.(info|list)|channel\.(info|list)|guild\.(info|list)|role\.list)$/.test(action)
  ) {
    return result;
  }
  const value = result.data ?? result;
  const kind =
    action.startsWith('guild.') || action === 'me.guilds'
      ? 'guild'
      : action.startsWith('channel.') || action === 'me.threads'
      ? 'channel'
      : action.startsWith('role.')
      ? 'role'
      : 'user';
  const item = (native: any) => {
    if (kind === 'user') {
      const n = native.user ?? native.member ?? native;
      const id =
        typeof n === 'string'
          ? n
          : n.UserId ??
            n.user_id ??
            n.userId ??
            n.open_id ??
            n.openid ??
            n.external_userid ??
            n.sender_id ??
            n.member_id ??
            n.id ??
            n.uin ??
            (n.name?.startsWith('users/') ? n.name : undefined);

      if (id === null || id === undefined) {
        return native;
      }
      const UserId = String(id);

      return {
        UserId,
        UserKey: createUserHashKey({ Platform: platform, UserId }),
        UserName: n.UserName ?? n.display_name ?? n.displayName ?? n.real_name ?? n.full_name ?? n.name ?? n.nickname ?? n.username,
        UserAvatar: n.UserAvatar ?? n.avatar_url ?? n.avatarUrl ?? n.pictureUrl ?? n.profilePictureUrl ?? n.headimgurl ?? n.profile?.image_192,
        IsMaster: isMaster(UserId, platform),
        IsBot: action === 'me.info' ? true : n.is_bot ?? n.isBot,
        GuildId: payload.GuildId ?? payload.params?.guildId,
        value: native
      };
    }
    const id =
      typeof native === 'string'
        ? native
        : native[`${kind[0].toUpperCase()}${kind.slice(1)}Id`] ??
          native.id ??
          native.chat_id ??
          native.room_id ??
          native.groupId ??
          native.group_id ??
          native.guild_id ??
          native.team_id ??
          native.name;

    if (id === null || id === undefined) {
      return native;
    }
    const prefix = kind[0].toUpperCase() + kind.slice(1);

    return {
      [`${prefix}Id`]: String(id),
      [`${prefix}Name`]: native[`${prefix}Name`] ?? native.display_name ?? native.displayName ?? native.name ?? native.groupName ?? native.group_name,
      ...(kind === 'channel'
        ? {
            GuildId: payload.GuildId ?? native.team_id,
            Topic: native.topic?.value ?? native.header ?? native.topic,
            ChannelType: native.type === 'voice' ? 'voice' : ['text', 'O', 'P', 'D', 'G'].includes(native.type) ? 'text' : 'unknown'
          }
        : {}),
      value: native
    };
  };

  if (action.endsWith('.info')) {
    return item(value.user ?? value.bot ?? value.channel ?? value.space ?? value);
  }
  let list = Array.isArray(value)
    ? value
    : value.Items ??
      value.items ??
      value.users ??
      value.members ??
      value.memberIds ??
      value.channels ??
      value.spaces ??
      value.teams ??
      value.subscriptions ??
      value.streams ??
      value.joined_rooms ??
      value.rooms;

  if (!list && value.joined) {
    list = Object.entries(value.joined).map(([id, n]: [string, any]) => ({ user_id: id, ...n }));
  }
  if (!Array.isArray(list)) {
    return result;
  }
  const items = list.map(item);

  if (action.startsWith('me.') || action === 'guild.list' || action === 'channel.list' || action === 'role.list') {
    return items;
  }

  return {
    Items: items,
    NextCursor: value.nextCursor ?? value.nextPageToken ?? value.page_token ?? value.response_metadata?.next_cursor ?? value.continuationToken ?? result.cursor,
    HasMore: value.has_more,
    value: result
  };
}
