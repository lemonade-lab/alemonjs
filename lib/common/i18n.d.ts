//#region src/common/i18n.d.ts
type Language = 'zh-CN' | 'en-US';
declare const messages: {
  readonly 'arg.named': {
    readonly 'zh-CN': '参数「{name}」';
    readonly 'en-US': 'Argument "{name}"';
  };
  readonly 'arg.indexed': {
    readonly 'zh-CN': '第{index}个参数';
    readonly 'en-US': 'Argument {index}';
  };
  readonly 'validation.pattern': {
    readonly 'zh-CN': '{arg}格式不正确';
    readonly 'en-US': '{arg} has an invalid format';
  };
  readonly 'validation.number': {
    readonly 'zh-CN': '{arg}必须是数字';
    readonly 'en-US': '{arg} must be a number';
  };
  readonly 'validation.min': {
    readonly 'zh-CN': '{arg}不能小于{min}';
    readonly 'en-US': '{arg} must be at least {min}';
  };
  readonly 'validation.max': {
    readonly 'zh-CN': '{arg}不能大于{max}';
    readonly 'en-US': '{arg} must not exceed {max}';
  };
  readonly 'validation.enum': {
    readonly 'zh-CN': '{arg}只能是 {values}';
    readonly 'en-US': '{arg} must be one of: {values}';
  };
  readonly 'validation.range': {
    readonly 'zh-CN': '{arg}必须是区间，例如 1-10';
    readonly 'en-US': '{arg} must be a range, for example 1-10';
  };
  readonly 'validation.rangeOrder': {
    readonly 'zh-CN': '{arg}的起点不能大于终点';
    readonly 'en-US': '{arg} must start at or before its end';
  };
  readonly 'validation.required': {
    readonly 'zh-CN': '{arg}是必填的';
    readonly 'en-US': '{arg} is required';
  };
  readonly 'validation.tooFew': {
    readonly 'zh-CN': '至少需要 {count} 个参数';
    readonly 'en-US': 'Minimum number of arguments: {count}';
  };
  readonly 'validation.tooMany': {
    readonly 'zh-CN': '最多需要 {count} 个参数';
    readonly 'en-US': 'Maximum number of arguments: {count}';
  };
  readonly 'validation.failed': {
    readonly 'zh-CN': '参数校验失败';
    readonly 'en-US': 'Argument validation failed';
  };
  readonly 'hint.required': {
    readonly 'zh-CN': '必填';
    readonly 'en-US': 'required';
  };
  readonly 'hint.optional': {
    readonly 'zh-CN': '可选';
    readonly 'en-US': 'optional';
  };
  readonly 'hint.number': {
    readonly 'zh-CN': '数字';
    readonly 'en-US': 'number';
  };
  readonly 'hint.enum': {
    readonly 'zh-CN': '枚举: {values}';
    readonly 'en-US': 'one of: {values}';
  };
  readonly 'hint.range': {
    readonly 'zh-CN': '区间';
    readonly 'en-US': 'range';
  };
  readonly 'hint.rest': {
    readonly 'zh-CN': '剩余文本';
    readonly 'en-US': 'remaining text';
  };
  readonly 'hint.text': {
    readonly 'zh-CN': '文本';
    readonly 'en-US': 'text';
  };
  readonly 'hint.min': {
    readonly 'zh-CN': '最小 {min}';
    readonly 'en-US': 'minimum {min}';
  };
  readonly 'hint.max': {
    readonly 'zh-CN': '最大 {max}';
    readonly 'en-US': 'maximum {max}';
  };
  readonly 'hint.separator': {
    readonly 'zh-CN': '，';
    readonly 'en-US': ', ';
  };
  readonly 'hint.labelSeparator': {
    readonly 'zh-CN': '：';
    readonly 'en-US': ': ';
  };
  readonly 'fallback.suggest': {
    readonly 'zh-CN': '我猜你想用的是 {command}。';
    readonly 'en-US': 'Did you mean {command}?';
  };
  readonly 'fallback.input': {
    readonly 'zh-CN': '可以直接输入：{command}';
    readonly 'en-US': 'You can enter: {command}';
  };
  readonly 'fallback.unknown': {
    readonly 'zh-CN': '我还没完全认出你这条指令。';
    readonly 'en-US': 'I could not recognize this command.';
  };
  readonly 'fallback.usage': {
    readonly 'zh-CN': '如果你想继续，可以这样写：`{usage}`';
    readonly 'en-US': 'To continue, enter: `{usage}`';
  };
  readonly 'fallback.closest': {
    readonly 'zh-CN': '你输入的内容更接近指令 `{command}`，请改用这个指令。';
    readonly 'en-US': 'Your input is closest to `{command}`. Please use that command.';
  };
  readonly 'reply.recognized': {
    readonly 'zh-CN': '我已经识别到你想用的是 {command}。';
    readonly 'en-US': 'I recognized the command {command}.';
  };
  readonly 'reply.incomplete': {
    readonly 'zh-CN': '这条指令的参数还不完整。';
    readonly 'en-US': 'This command is missing arguments.';
  };
  readonly 'reply.usage': {
    readonly 'zh-CN': '你可以这样输入：`{usage}`';
    readonly 'en-US': 'You can enter: `{usage}`';
  };
  readonly 'reply.complete': {
    readonly 'zh-CN': '请继续补全 {command} 所需的参数。';
    readonly 'en-US': 'Please provide the remaining arguments for {command}.';
  };
  readonly 'reply.arguments': {
    readonly 'zh-CN': '参数说明：';
    readonly 'en-US': 'Arguments:';
  };
  readonly 'result.missing.channelid.messageid.or.emojiid': {
    readonly 'zh-CN': '缺少 ChannelId、MessageId 或 EmojiId';
    readonly 'en-US': 'Missing ChannelId, MessageId or EmojiId';
  };
  readonly 'result.reaction.add.not.supported.or.failed': {
    readonly 'zh-CN': '不支持添加回应或操作失败';
    readonly 'en-US': 'Reaction add not supported or failed';
  };
  readonly 'result.failed.to.add.reaction': {
    readonly 'zh-CN': '添加回应失败';
    readonly 'en-US': 'Failed to add reaction';
  };
  readonly 'result.reaction.remove.not.supported.or.failed': {
    readonly 'zh-CN': '不支持移除回应或操作失败';
    readonly 'en-US': 'Reaction remove not supported or failed';
  };
  readonly 'result.failed.to.remove.reaction': {
    readonly 'zh-CN': '移除回应失败';
    readonly 'en-US': 'Failed to remove reaction';
  };
  readonly 'result.reaction.list.not.supported.or.failed': {
    readonly 'zh-CN': '不支持获取回应列表或操作失败';
    readonly 'en-US': 'Reaction list not supported or failed';
  };
  readonly 'result.failed.to.list.reactions': {
    readonly 'zh-CN': '获取回应列表失败';
    readonly 'en-US': 'Failed to list reactions';
  };
  readonly 'result.missing.channelid': {
    readonly 'zh-CN': '缺少 ChannelId';
    readonly 'en-US': 'Missing ChannelId';
  };
  readonly 'result.history.list.not.supported.or.failed': {
    readonly 'zh-CN': '不支持获取历史记录或操作失败';
    readonly 'en-US': 'History list not supported or failed';
  };
  readonly 'result.failed.to.get.message.history': {
    readonly 'zh-CN': '获取消息历史失败';
    readonly 'en-US': 'Failed to get message history';
  };
  readonly 'result.missing.guildid': {
    readonly 'zh-CN': '缺少 GuildId';
    readonly 'en-US': 'Missing GuildId';
  };
  readonly 'result.successfully.retrieved.guild.info': {
    readonly 'zh-CN': '成功获取群组信息';
    readonly 'en-US': 'Successfully retrieved guild info';
  };
  readonly 'result.no.guild.info.found': {
    readonly 'zh-CN': '未找到群组信息';
    readonly 'en-US': 'No guild info found';
  };
  readonly 'result.failed.to.get.guild.info': {
    readonly 'zh-CN': '获取群组信息失败';
    readonly 'en-US': 'Failed to get guild info';
  };
  readonly 'result.successfully.retrieved.guild.list': {
    readonly 'zh-CN': '成功获取群组列表';
    readonly 'en-US': 'Successfully retrieved guild list';
  };
  readonly 'result.no.guild.list.found': {
    readonly 'zh-CN': '未找到群组列表';
    readonly 'en-US': 'No guild list found';
  };
  readonly 'result.failed.to.get.guild.list': {
    readonly 'zh-CN': '获取群组列表失败';
    readonly 'en-US': 'Failed to get guild list';
  };
  readonly 'result.update.not.supported.or.failed': {
    readonly 'zh-CN': '不支持更新或操作失败';
    readonly 'en-US': 'Update not supported or failed';
  };
  readonly 'result.failed.to.update.guild': {
    readonly 'zh-CN': '更新群组失败';
    readonly 'en-US': 'Failed to update guild';
  };
  readonly 'result.leave.not.supported.or.failed': {
    readonly 'zh-CN': '不支持退出群组或操作失败';
    readonly 'en-US': 'Leave not supported or failed';
  };
  readonly 'result.failed.to.leave.guild': {
    readonly 'zh-CN': '退出群组失败';
    readonly 'en-US': 'Failed to leave guild';
  };
  readonly 'result.mute.not.supported.or.failed': {
    readonly 'zh-CN': '不支持禁言或操作失败';
    readonly 'en-US': 'Mute not supported or failed';
  };
  readonly 'result.failed.to.mute.guild': {
    readonly 'zh-CN': '设置全群禁言失败';
    readonly 'en-US': 'Failed to mute guild';
  };
  readonly 'result.successfully.retrieved.mention.data': {
    readonly 'zh-CN': '成功获取提及信息';
    readonly 'en-US': 'Successfully retrieved mention data';
  };
  readonly 'result.missing.guildid.or.messageid': {
    readonly 'zh-CN': '缺少 GuildId 或 MessageId';
    readonly 'en-US': 'Missing GuildId or MessageId';
  };
  readonly 'result.announce.set.not.supported.or.failed': {
    readonly 'zh-CN': '不支持设置公告或操作失败';
    readonly 'en-US': 'Announce set not supported or failed';
  };
  readonly 'result.failed.to.set.announcement': {
    readonly 'zh-CN': '设置公告失败';
    readonly 'en-US': 'Failed to set announcement';
  };
  readonly 'result.announce.remove.not.supported.or.failed': {
    readonly 'zh-CN': '不支持删除公告或操作失败';
    readonly 'en-US': 'Announce remove not supported or failed';
  };
  readonly 'result.failed.to.remove.announcement': {
    readonly 'zh-CN': '删除公告失败';
    readonly 'en-US': 'Failed to remove announcement';
  };
  readonly 'result.connection.status.is.not.supported': {
    readonly 'zh-CN': '不支持获取连接状态';
    readonly 'en-US': 'Connection status is not supported';
  };
  readonly 'result.failed.to.get.connection.status': {
    readonly 'zh-CN': '获取连接状态失败';
    readonly 'en-US': 'Failed to get connection status';
  };
  readonly 'result.successfully.retrieved.role.list': {
    readonly 'zh-CN': '成功获取角色列表';
    readonly 'en-US': 'Successfully retrieved role list';
  };
  readonly 'result.no.role.list.found': {
    readonly 'zh-CN': '未找到角色列表';
    readonly 'en-US': 'No role list found';
  };
  readonly 'result.failed.to.get.role.list': {
    readonly 'zh-CN': '获取角色列表失败';
    readonly 'en-US': 'Failed to get role list';
  };
  readonly 'result.role.created': {
    readonly 'zh-CN': '角色创建成功';
    readonly 'en-US': 'Role created';
  };
  readonly 'result.create.not.supported.or.failed': {
    readonly 'zh-CN': '不支持创建或操作失败';
    readonly 'en-US': 'Create not supported or failed';
  };
  readonly 'result.failed.to.create.role': {
    readonly 'zh-CN': '创建角色失败';
    readonly 'en-US': 'Failed to create role';
  };
  readonly 'result.missing.guildid.or.roleid': {
    readonly 'zh-CN': '缺少 GuildId 或 RoleId';
    readonly 'en-US': 'Missing GuildId or RoleId';
  };
  readonly 'result.failed.to.update.role': {
    readonly 'zh-CN': '更新角色失败';
    readonly 'en-US': 'Failed to update role';
  };
  readonly 'result.delete.not.supported.or.failed': {
    readonly 'zh-CN': '不支持删除或操作失败';
    readonly 'en-US': 'Delete not supported or failed';
  };
  readonly 'result.failed.to.delete.role': {
    readonly 'zh-CN': '删除角色失败';
    readonly 'en-US': 'Failed to delete role';
  };
  readonly 'result.missing.guildid.userid.or.roleid': {
    readonly 'zh-CN': '缺少 GuildId、UserId 或 RoleId';
    readonly 'en-US': 'Missing GuildId, UserId or RoleId';
  };
  readonly 'result.assign.not.supported.or.failed': {
    readonly 'zh-CN': '不支持分配角色或操作失败';
    readonly 'en-US': 'Assign not supported or failed';
  };
  readonly 'result.failed.to.assign.role': {
    readonly 'zh-CN': '分配角色失败';
    readonly 'en-US': 'Failed to assign role';
  };
  readonly 'result.remove.not.supported.or.failed': {
    readonly 'zh-CN': '不支持移除或操作失败';
    readonly 'en-US': 'Remove not supported or failed';
  };
  readonly 'result.failed.to.remove.role': {
    readonly 'zh-CN': '移除角色失败';
    readonly 'en-US': 'Failed to remove role';
  };
  readonly 'result.invalid.val.val.must.be.a.non.empty.array': {
    readonly 'zh-CN': 'val 必须是非空数组';
    readonly 'en-US': 'Invalid val: val must be a non-empty array';
  };
  readonly 'result.missing.messageid': {
    readonly 'zh-CN': '缺少 MessageId';
    readonly 'en-US': 'Missing MessageId';
  };
  readonly 'result.failed.to.delete.message': {
    readonly 'zh-CN': '删除消息失败';
    readonly 'en-US': 'Failed to delete message';
  };
  readonly 'result.missing.messageid.or.channelid': {
    readonly 'zh-CN': '缺少 MessageId 或 ChannelId';
    readonly 'en-US': 'Missing MessageId or ChannelId';
  };
  readonly 'result.edit.not.supported.or.failed': {
    readonly 'zh-CN': '不支持编辑或操作失败';
    readonly 'en-US': 'Edit not supported or failed';
  };
  readonly 'result.failed.to.edit.message': {
    readonly 'zh-CN': '编辑消息失败';
    readonly 'en-US': 'Failed to edit message';
  };
  readonly 'result.pin.not.supported.or.failed': {
    readonly 'zh-CN': '不支持置顶或操作失败';
    readonly 'en-US': 'Pin not supported or failed';
  };
  readonly 'result.failed.to.pin.message': {
    readonly 'zh-CN': '置顶消息失败';
    readonly 'en-US': 'Failed to pin message';
  };
  readonly 'result.unpin.not.supported.or.failed': {
    readonly 'zh-CN': '不支持取消置顶或操作失败';
    readonly 'en-US': 'Unpin not supported or failed';
  };
  readonly 'result.failed.to.unpin.message': {
    readonly 'zh-CN': '取消消息置顶失败';
    readonly 'en-US': 'Failed to unpin message';
  };
  readonly 'result.get.message.not.supported.or.failed': {
    readonly 'zh-CN': '不支持获取消息或操作失败';
    readonly 'en-US': 'Get message not supported or failed';
  };
  readonly 'result.failed.to.get.message': {
    readonly 'zh-CN': '获取消息失败';
    readonly 'en-US': 'Failed to get message';
  };
  readonly 'result.successfully.retrieved.member.information': {
    readonly 'zh-CN': '成功获取成员信息';
    readonly 'en-US': 'Successfully retrieved member information';
  };
  readonly 'result.no.member.information.found': {
    readonly 'zh-CN': '未找到成员信息';
    readonly 'en-US': 'No member information found';
  };
  readonly 'result.failed.to.get.member.information': {
    readonly 'zh-CN': '获取成员信息失败';
    readonly 'en-US': 'Failed to get member information';
  };
  readonly 'result.successfully.retrieved.member.list': {
    readonly 'zh-CN': '成功获取成员列表';
    readonly 'en-US': 'Successfully retrieved member list';
  };
  readonly 'result.no.member.list.found': {
    readonly 'zh-CN': '未找到成员列表';
    readonly 'en-US': 'No member list found';
  };
  readonly 'result.failed.to.get.member.list': {
    readonly 'zh-CN': '获取成员列表失败';
    readonly 'en-US': 'Failed to get member list';
  };
  readonly 'result.missing.guildid.or.userid': {
    readonly 'zh-CN': '缺少 GuildId 或 UserId';
    readonly 'en-US': 'Missing GuildId or UserId';
  };
  readonly 'result.kick.not.supported.or.failed': {
    readonly 'zh-CN': '不支持移除成员或操作失败';
    readonly 'en-US': 'Kick not supported or failed';
  };
  readonly 'result.failed.to.kick.member': {
    readonly 'zh-CN': '移除成员失败';
    readonly 'en-US': 'Failed to kick member';
  };
  readonly 'result.ban.not.supported.or.failed': {
    readonly 'zh-CN': '不支持封禁或操作失败';
    readonly 'en-US': 'Ban not supported or failed';
  };
  readonly 'result.failed.to.ban.member': {
    readonly 'zh-CN': '封禁成员失败';
    readonly 'en-US': 'Failed to ban member';
  };
  readonly 'result.unban.not.supported.or.failed': {
    readonly 'zh-CN': '不支持解除封禁或操作失败';
    readonly 'en-US': 'Unban not supported or failed';
  };
  readonly 'result.failed.to.unban.member': {
    readonly 'zh-CN': '解除成员封禁失败';
    readonly 'en-US': 'Failed to unban member';
  };
  readonly 'result.missing.guildid.or.keyword': {
    readonly 'zh-CN': '缺少 GuildId 或 keyword';
    readonly 'en-US': 'Missing GuildId or keyword';
  };
  readonly 'result.member.search.not.supported.or.failed': {
    readonly 'zh-CN': '不支持搜索成员或操作失败';
    readonly 'en-US': 'Member search not supported or failed';
  };
  readonly 'result.failed.to.search.members': {
    readonly 'zh-CN': '搜索成员失败';
    readonly 'en-US': 'Failed to search members';
  };
  readonly 'result.failed.to.mute.member': {
    readonly 'zh-CN': '禁言成员失败';
    readonly 'en-US': 'Failed to mute member';
  };
  readonly 'result.admin.set.not.supported.or.failed': {
    readonly 'zh-CN': '不支持设置管理员或操作失败';
    readonly 'en-US': 'Admin set not supported or failed';
  };
  readonly 'result.failed.to.set.admin': {
    readonly 'zh-CN': '设置管理员失败';
    readonly 'en-US': 'Failed to set admin';
  };
  readonly 'result.card.set.not.supported.or.failed': {
    readonly 'zh-CN': '不支持设置名片或操作失败';
    readonly 'en-US': 'Card set not supported or failed';
  };
  readonly 'result.failed.to.set.member.card': {
    readonly 'zh-CN': '设置成员名片失败';
    readonly 'en-US': 'Failed to set member card';
  };
  readonly 'result.title.set.not.supported.or.failed': {
    readonly 'zh-CN': '不支持设置头衔或操作失败';
    readonly 'en-US': 'Title set not supported or failed';
  };
  readonly 'result.failed.to.set.member.title': {
    readonly 'zh-CN': '设置成员头衔失败';
    readonly 'en-US': 'Failed to set member title';
  };
  readonly 'result.missing.flag': {
    readonly 'zh-CN': '缺少 flag';
    readonly 'en-US': 'Missing flag';
  };
  readonly 'result.friend.request.handling.not.supported.or.failed': {
    readonly 'zh-CN': '不支持处理好友请求或操作失败';
    readonly 'en-US': 'Friend request handling not supported or failed';
  };
  readonly 'result.failed.to.handle.friend.request': {
    readonly 'zh-CN': '处理好友请求失败';
    readonly 'en-US': 'Failed to handle friend request';
  };
  readonly 'result.missing.flag.or.subtype': {
    readonly 'zh-CN': '缺少 flag 或 subType';
    readonly 'en-US': 'Missing flag or subType';
  };
  readonly 'result.guild.request.handling.not.supported.or.failed': {
    readonly 'zh-CN': '不支持处理入群请求或操作失败';
    readonly 'en-US': 'Guild request handling not supported or failed';
  };
  readonly 'result.failed.to.handle.guild.request': {
    readonly 'zh-CN': '处理入群请求失败';
    readonly 'en-US': 'Failed to handle guild request';
  };
  readonly 'result.successfully.retrieved.channel.info': {
    readonly 'zh-CN': '成功获取频道信息';
    readonly 'en-US': 'Successfully retrieved channel info';
  };
  readonly 'result.no.channel.info.found': {
    readonly 'zh-CN': '未找到频道信息';
    readonly 'en-US': 'No channel info found';
  };
  readonly 'result.failed.to.get.channel.info': {
    readonly 'zh-CN': '获取频道信息失败';
    readonly 'en-US': 'Failed to get channel info';
  };
  readonly 'result.successfully.retrieved.channel.list': {
    readonly 'zh-CN': '成功获取频道列表';
    readonly 'en-US': 'Successfully retrieved channel list';
  };
  readonly 'result.no.channel.list.found': {
    readonly 'zh-CN': '未找到频道列表';
    readonly 'en-US': 'No channel list found';
  };
  readonly 'result.failed.to.get.channel.list': {
    readonly 'zh-CN': '获取频道列表失败';
    readonly 'en-US': 'Failed to get channel list';
  };
  readonly 'result.channel.created': {
    readonly 'zh-CN': '频道创建成功';
    readonly 'en-US': 'Channel created';
  };
  readonly 'result.failed.to.create.channel': {
    readonly 'zh-CN': '创建频道失败';
    readonly 'en-US': 'Failed to create channel';
  };
  readonly 'result.failed.to.update.channel': {
    readonly 'zh-CN': '更新频道失败';
    readonly 'en-US': 'Failed to update channel';
  };
  readonly 'result.failed.to.delete.channel': {
    readonly 'zh-CN': '删除频道失败';
    readonly 'en-US': 'Failed to delete channel';
  };
  readonly 'result.missing.channelid.or.userid': {
    readonly 'zh-CN': '缺少 ChannelId 或 UserId';
    readonly 'en-US': 'Missing ChannelId or UserId';
  };
  readonly 'result.permission.get.not.supported.or.failed': {
    readonly 'zh-CN': '不支持获取权限或操作失败';
    readonly 'en-US': 'Permission get not supported or failed';
  };
  readonly 'result.failed.to.get.permission': {
    readonly 'zh-CN': '获取权限失败';
    readonly 'en-US': 'Failed to get permission';
  };
  readonly 'result.permission.set.not.supported.or.failed': {
    readonly 'zh-CN': '不支持设置权限或操作失败';
    readonly 'en-US': 'Permission set not supported or failed';
  };
  readonly 'result.failed.to.set.permission': {
    readonly 'zh-CN': '设置权限失败';
    readonly 'en-US': 'Failed to set permission';
  };
  readonly 'result.missing.interactionid': {
    readonly 'zh-CN': '缺少 InteractionId';
    readonly 'en-US': 'Missing InteractionId';
  };
  readonly 'result.interaction.acknowledgement.is.not.supported': {
    readonly 'zh-CN': '不支持确认交互';
    readonly 'en-US': 'Interaction acknowledgement is not supported';
  };
  readonly 'result.failed.to.acknowledge.interaction': {
    readonly 'zh-CN': '确认交互失败';
    readonly 'en-US': 'Failed to acknowledge interaction';
  };
  readonly 'result.successfully.retrieved.bot.information': {
    readonly 'zh-CN': '成功获取机器人信息';
    readonly 'en-US': 'Successfully retrieved bot information';
  };
  readonly 'result.no.bot.information.found': {
    readonly 'zh-CN': '未找到机器人信息';
    readonly 'en-US': 'No bot information found';
  };
  readonly 'result.failed.to.get.bot.information': {
    readonly 'zh-CN': '获取机器人信息失败';
    readonly 'en-US': 'Failed to get bot information';
  };
  readonly 'result.successfully.checked.whether.the.bot.was.mentioned': {
    readonly 'zh-CN': '已检查是否提及机器人';
    readonly 'en-US': 'Successfully checked whether the bot was mentioned';
  };
  readonly 'result.use.media.send.for.message.delivery.options': {
    readonly 'zh-CN': '请使用 media.send 设置消息发送选项';
    readonly 'en-US': 'Use media.send for message delivery options';
  };
  readonly 'result.provide.exactly.one.media.source': {
    readonly 'zh-CN': '请提供且仅提供一个媒体来源';
    readonly 'en-US': 'Provide exactly one media source';
  };
  readonly 'result.media.upload.not.supported.or.failed': {
    readonly 'zh-CN': '不支持上传媒体或操作失败';
    readonly 'en-US': 'Media upload not supported or failed';
  };
  readonly 'result.failed.to.upload.media': {
    readonly 'zh-CN': '上传媒体失败';
    readonly 'en-US': 'Failed to upload media';
  };
  readonly 'result.invalid.media.source.or.conflicting.channel.target': {
    readonly 'zh-CN': '媒体来源无效或频道目标冲突';
    readonly 'en-US': 'Invalid media source or conflicting channel target';
  };
  readonly 'result.media.send.not.supported.or.failed': {
    readonly 'zh-CN': '不支持发送媒体或操作失败';
    readonly 'en-US': 'Media send not supported or failed';
  };
  readonly 'result.failed.to.send.media.to.channel': {
    readonly 'zh-CN': '向频道发送媒体失败';
    readonly 'en-US': 'Failed to send media to channel';
  };
  readonly 'result.invalid.media.source.or.conflicting.user.target': {
    readonly 'zh-CN': '媒体来源无效或用户目标冲突';
    readonly 'en-US': 'Invalid media source or conflicting user target';
  };
  readonly 'result.missing.userid': {
    readonly 'zh-CN': '缺少 UserId';
    readonly 'en-US': 'Missing UserId';
  };
  readonly 'result.failed.to.send.media.to.user': {
    readonly 'zh-CN': '向用户发送媒体失败';
    readonly 'en-US': 'Failed to send media to user';
  };
  readonly 'result.missing.targetid': {
    readonly 'zh-CN': '缺少 targetId';
    readonly 'en-US': 'Missing targetId';
  };
  readonly 'result.failed.to.send.media': {
    readonly 'zh-CN': '发送媒体失败';
    readonly 'en-US': 'Failed to send media';
  };
  readonly 'result.successfully.retrieved.user.info': {
    readonly 'zh-CN': '成功获取用户信息';
    readonly 'en-US': 'Successfully retrieved user info';
  };
  readonly 'result.no.user.info.found': {
    readonly 'zh-CN': '未找到用户信息';
    readonly 'en-US': 'No user info found';
  };
  readonly 'result.failed.to.get.user.info': {
    readonly 'zh-CN': '获取用户信息失败';
    readonly 'en-US': 'Failed to get user info';
  };
  readonly 'result.retrieved.successfully': {
    readonly 'zh-CN': '获取成功';
    readonly 'en-US': 'Retrieved successfully';
  };
  readonly 'result.api.request.timed.out': {
    readonly 'zh-CN': '接口超时';
    readonly 'en-US': 'API request timed out';
  };
  readonly 'result.chatbot.client.is.not.available': {
    readonly 'zh-CN': '机器人客户端不可用';
    readonly 'en-US': 'Chatbot client is not available';
  };
  readonly 'result.action.timed.out': {
    readonly 'zh-CN': '行为超时';
    readonly 'en-US': 'Action timed out';
  };
  readonly 'result.api.processing.failed': {
    readonly 'zh-CN': '接口处理错误';
    readonly 'en-US': 'API processing failed';
  };
  readonly 'result.action.processing.failed': {
    readonly 'zh-CN': '消费处理错误';
    readonly 'en-US': 'Action processing failed';
  };
  readonly 'http.appUnavailable': {
    readonly 'zh-CN': '应用未注册或未启用';
    readonly 'en-US': 'Application is not registered or enabled';
  };
  readonly 'http.appLoading': {
    readonly 'zh-CN': '应用正在初始化';
    readonly 'en-US': 'Application is initializing';
  };
  readonly 'http.appFailed': {
    readonly 'zh-CN': '应用生命周期失败';
    readonly 'en-US': 'Application lifecycle failed';
  };
  readonly 'http.appDisposed': {
    readonly 'zh-CN': '应用已卸载或已结束服务';
    readonly 'en-US': 'Application has been unloaded or stopped';
  };
  readonly 'http.capabilityUnavailable': {
    readonly 'zh-CN': '应用未提供对应服务能力';
    readonly 'en-US': 'Application does not provide this capability';
  };
  readonly 'http.routerFailed': {
    readonly 'zh-CN': '处理 Koa Router 请求时发生错误。';
    readonly 'en-US': 'Failed to process router request.';
  };
  readonly 'http.packageFailed': {
    readonly 'zh-CN': '加载 package.json 时发生错误。';
    readonly 'en-US': 'Failed to load package.json.';
  };
  readonly 'http.invalidPath': {
    readonly 'zh-CN': '非法路径';
    readonly 'en-US': 'Invalid path';
  };
  readonly 'http.resourceFailed': {
    readonly 'zh-CN': '加载资源时发生服务器错误。';
    readonly 'en-US': 'Server error while loading resources.';
  };
  readonly 'http.frontendMissing': {
    readonly 'zh-CN': '前端尚未构建';
    readonly 'en-US': 'Frontend has not been built';
  };
  readonly 'http.online': {
    readonly 'zh-CN': '服务在线';
    readonly 'en-US': 'Service online';
  };
  readonly 'http.apps': {
    readonly 'zh-CN': '运行时应用列表';
    readonly 'en-US': 'Runtime applications';
  };
  readonly 'http.appMissing': {
    readonly 'zh-CN': '应用未注册';
    readonly 'en-US': 'Application is not registered';
  };
  readonly 'http.app': {
    readonly 'zh-CN': '运行时应用';
    readonly 'en-US': 'Runtime application';
  };
  readonly 'http.entryMissing': {
    readonly 'zh-CN': '没有主要入口文件';
    readonly 'en-US': 'No main entry file';
  };
  readonly 'http.entryNotFound': {
    readonly 'zh-CN': '未找到主要入口文件';
    readonly 'en-US': 'Main entry file not found';
  };
  readonly 'http.apiFailed': {
    readonly 'zh-CN': '处理 API 请求时发生错误。';
    readonly 'en-US': 'Failed to process API request.';
  };
  readonly 'http.resourceNotFound': {
    readonly 'zh-CN': '资源中未找到。';
    readonly 'en-US': 'Resource not found.';
  };
  readonly 'http.invalidApp': {
    readonly 'zh-CN': '无效的应用名称';
    readonly 'en-US': 'Invalid application name';
  };
  readonly 'http.appResourceFailed': {
    readonly 'zh-CN': "加载子应用 '{app}' 资源时发生服务器错误。";
    readonly 'en-US': "Server error while loading resources for application '{app}'.";
  };
  readonly 'http.apiNotFound': {
    readonly 'zh-CN': "API '{path}' 未找到。";
    readonly 'en-US': "API '{path}' not found.";
  };
  readonly 'http.routeNotFound': {
    readonly 'zh-CN': "API 'route/{path}' 未找到。";
    readonly 'en-US': "API 'route/{path}' not found.";
  };
  readonly 'http.appResourceNotFound': {
    readonly 'zh-CN': "资源 '{resource}' 在子应用 '{app}' 中未找到。";
    readonly 'en-US': "Resource '{resource}' not found in application '{app}'.";
  };
  readonly 'action.unsupported': {
    readonly 'zh-CN': '不支持操作 {action}';
    readonly 'en-US': '{action} is not supported';
  };
  readonly 'action.failed': {
    readonly 'zh-CN': '操作 {action} 失败';
    readonly 'en-US': '{action} failed';
  };
};
type MessageKey = keyof typeof messages;
/** Unknown or missing languages fall back to Chinese. */
declare function getLanguage(): Language;
/** Override the language for this callback, including asynchronous work, without affecting other requests. */
declare function withLanguage<T>(language: Language, callback: () => T): T;
/** Resolve framework copy at use time so configuration reloads take effect. */
declare function translate(key: MessageKey, params?: Record<string, string | number>): string;
//#endregion
export { Language, MessageKey, getLanguage, translate, withLanguage };