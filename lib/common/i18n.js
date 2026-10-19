import { getConfigValue } from "./config.js";
import { AsyncLocalStorage } from "node:async_hooks";

//#region src/common/i18n.ts
const messages = {
	"arg.named": {
		"zh-CN": "参数「{name}」",
		"en-US": "Argument \"{name}\""
	},
	"arg.indexed": {
		"zh-CN": "第{index}个参数",
		"en-US": "Argument {index}"
	},
	"validation.pattern": {
		"zh-CN": "{arg}格式不正确",
		"en-US": "{arg} has an invalid format"
	},
	"validation.number": {
		"zh-CN": "{arg}必须是数字",
		"en-US": "{arg} must be a number"
	},
	"validation.min": {
		"zh-CN": "{arg}不能小于{min}",
		"en-US": "{arg} must be at least {min}"
	},
	"validation.max": {
		"zh-CN": "{arg}不能大于{max}",
		"en-US": "{arg} must not exceed {max}"
	},
	"validation.enum": {
		"zh-CN": "{arg}只能是 {values}",
		"en-US": "{arg} must be one of: {values}"
	},
	"validation.range": {
		"zh-CN": "{arg}必须是区间，例如 1-10",
		"en-US": "{arg} must be a range, for example 1-10"
	},
	"validation.rangeOrder": {
		"zh-CN": "{arg}的起点不能大于终点",
		"en-US": "{arg} must start at or before its end"
	},
	"validation.required": {
		"zh-CN": "{arg}是必填的",
		"en-US": "{arg} is required"
	},
	"validation.tooFew": {
		"zh-CN": "至少需要 {count} 个参数",
		"en-US": "Minimum number of arguments: {count}"
	},
	"validation.tooMany": {
		"zh-CN": "最多需要 {count} 个参数",
		"en-US": "Maximum number of arguments: {count}"
	},
	"validation.failed": {
		"zh-CN": "参数校验失败",
		"en-US": "Argument validation failed"
	},
	"hint.required": {
		"zh-CN": "必填",
		"en-US": "required"
	},
	"hint.optional": {
		"zh-CN": "可选",
		"en-US": "optional"
	},
	"hint.number": {
		"zh-CN": "数字",
		"en-US": "number"
	},
	"hint.enum": {
		"zh-CN": "枚举: {values}",
		"en-US": "one of: {values}"
	},
	"hint.range": {
		"zh-CN": "区间",
		"en-US": "range"
	},
	"hint.rest": {
		"zh-CN": "剩余文本",
		"en-US": "remaining text"
	},
	"hint.text": {
		"zh-CN": "文本",
		"en-US": "text"
	},
	"hint.min": {
		"zh-CN": "最小 {min}",
		"en-US": "minimum {min}"
	},
	"hint.max": {
		"zh-CN": "最大 {max}",
		"en-US": "maximum {max}"
	},
	"hint.separator": {
		"zh-CN": "，",
		"en-US": ", "
	},
	"hint.labelSeparator": {
		"zh-CN": "：",
		"en-US": ": "
	},
	"fallback.suggest": {
		"zh-CN": "我猜你想用的是 {command}。",
		"en-US": "Did you mean {command}?"
	},
	"fallback.input": {
		"zh-CN": "可以直接输入：{command}",
		"en-US": "You can enter: {command}"
	},
	"fallback.unknown": {
		"zh-CN": "我还没完全认出你这条指令。",
		"en-US": "I could not recognize this command."
	},
	"fallback.usage": {
		"zh-CN": "如果你想继续，可以这样写：`{usage}`",
		"en-US": "To continue, enter: `{usage}`"
	},
	"fallback.closest": {
		"zh-CN": "你输入的内容更接近指令 `{command}`，请改用这个指令。",
		"en-US": "Your input is closest to `{command}`. Please use that command."
	},
	"reply.recognized": {
		"zh-CN": "我已经识别到你想用的是 {command}。",
		"en-US": "I recognized the command {command}."
	},
	"reply.incomplete": {
		"zh-CN": "这条指令的参数还不完整。",
		"en-US": "This command is missing arguments."
	},
	"reply.usage": {
		"zh-CN": "你可以这样输入：`{usage}`",
		"en-US": "You can enter: `{usage}`"
	},
	"reply.complete": {
		"zh-CN": "请继续补全 {command} 所需的参数。",
		"en-US": "Please provide the remaining arguments for {command}."
	},
	"reply.arguments": {
		"zh-CN": "参数说明：",
		"en-US": "Arguments:"
	},
	"result.missing.channelid.messageid.or.emojiid": {
		"zh-CN": "缺少 ChannelId、MessageId 或 EmojiId",
		"en-US": "Missing ChannelId, MessageId or EmojiId"
	},
	"result.reaction.add.not.supported.or.failed": {
		"zh-CN": "不支持添加回应或操作失败",
		"en-US": "Reaction add not supported or failed"
	},
	"result.failed.to.add.reaction": {
		"zh-CN": "添加回应失败",
		"en-US": "Failed to add reaction"
	},
	"result.reaction.remove.not.supported.or.failed": {
		"zh-CN": "不支持移除回应或操作失败",
		"en-US": "Reaction remove not supported or failed"
	},
	"result.failed.to.remove.reaction": {
		"zh-CN": "移除回应失败",
		"en-US": "Failed to remove reaction"
	},
	"result.reaction.list.not.supported.or.failed": {
		"zh-CN": "不支持获取回应列表或操作失败",
		"en-US": "Reaction list not supported or failed"
	},
	"result.failed.to.list.reactions": {
		"zh-CN": "获取回应列表失败",
		"en-US": "Failed to list reactions"
	},
	"result.missing.channelid": {
		"zh-CN": "缺少 ChannelId",
		"en-US": "Missing ChannelId"
	},
	"result.history.list.not.supported.or.failed": {
		"zh-CN": "不支持获取历史记录或操作失败",
		"en-US": "History list not supported or failed"
	},
	"result.failed.to.get.message.history": {
		"zh-CN": "获取消息历史失败",
		"en-US": "Failed to get message history"
	},
	"result.missing.guildid": {
		"zh-CN": "缺少 GuildId",
		"en-US": "Missing GuildId"
	},
	"result.successfully.retrieved.guild.info": {
		"zh-CN": "成功获取群组信息",
		"en-US": "Successfully retrieved guild info"
	},
	"result.no.guild.info.found": {
		"zh-CN": "未找到群组信息",
		"en-US": "No guild info found"
	},
	"result.failed.to.get.guild.info": {
		"zh-CN": "获取群组信息失败",
		"en-US": "Failed to get guild info"
	},
	"result.successfully.retrieved.guild.list": {
		"zh-CN": "成功获取群组列表",
		"en-US": "Successfully retrieved guild list"
	},
	"result.no.guild.list.found": {
		"zh-CN": "未找到群组列表",
		"en-US": "No guild list found"
	},
	"result.failed.to.get.guild.list": {
		"zh-CN": "获取群组列表失败",
		"en-US": "Failed to get guild list"
	},
	"result.update.not.supported.or.failed": {
		"zh-CN": "不支持更新或操作失败",
		"en-US": "Update not supported or failed"
	},
	"result.failed.to.update.guild": {
		"zh-CN": "更新群组失败",
		"en-US": "Failed to update guild"
	},
	"result.leave.not.supported.or.failed": {
		"zh-CN": "不支持退出群组或操作失败",
		"en-US": "Leave not supported or failed"
	},
	"result.failed.to.leave.guild": {
		"zh-CN": "退出群组失败",
		"en-US": "Failed to leave guild"
	},
	"result.mute.not.supported.or.failed": {
		"zh-CN": "不支持禁言或操作失败",
		"en-US": "Mute not supported or failed"
	},
	"result.failed.to.mute.guild": {
		"zh-CN": "设置全群禁言失败",
		"en-US": "Failed to mute guild"
	},
	"result.successfully.retrieved.mention.data": {
		"zh-CN": "成功获取提及信息",
		"en-US": "Successfully retrieved mention data"
	},
	"result.missing.guildid.or.messageid": {
		"zh-CN": "缺少 GuildId 或 MessageId",
		"en-US": "Missing GuildId or MessageId"
	},
	"result.announce.set.not.supported.or.failed": {
		"zh-CN": "不支持设置公告或操作失败",
		"en-US": "Announce set not supported or failed"
	},
	"result.failed.to.set.announcement": {
		"zh-CN": "设置公告失败",
		"en-US": "Failed to set announcement"
	},
	"result.announce.remove.not.supported.or.failed": {
		"zh-CN": "不支持删除公告或操作失败",
		"en-US": "Announce remove not supported or failed"
	},
	"result.failed.to.remove.announcement": {
		"zh-CN": "删除公告失败",
		"en-US": "Failed to remove announcement"
	},
	"result.connection.status.is.not.supported": {
		"zh-CN": "不支持获取连接状态",
		"en-US": "Connection status is not supported"
	},
	"result.failed.to.get.connection.status": {
		"zh-CN": "获取连接状态失败",
		"en-US": "Failed to get connection status"
	},
	"result.successfully.retrieved.role.list": {
		"zh-CN": "成功获取角色列表",
		"en-US": "Successfully retrieved role list"
	},
	"result.no.role.list.found": {
		"zh-CN": "未找到角色列表",
		"en-US": "No role list found"
	},
	"result.failed.to.get.role.list": {
		"zh-CN": "获取角色列表失败",
		"en-US": "Failed to get role list"
	},
	"result.role.created": {
		"zh-CN": "角色创建成功",
		"en-US": "Role created"
	},
	"result.create.not.supported.or.failed": {
		"zh-CN": "不支持创建或操作失败",
		"en-US": "Create not supported or failed"
	},
	"result.failed.to.create.role": {
		"zh-CN": "创建角色失败",
		"en-US": "Failed to create role"
	},
	"result.missing.guildid.or.roleid": {
		"zh-CN": "缺少 GuildId 或 RoleId",
		"en-US": "Missing GuildId or RoleId"
	},
	"result.failed.to.update.role": {
		"zh-CN": "更新角色失败",
		"en-US": "Failed to update role"
	},
	"result.delete.not.supported.or.failed": {
		"zh-CN": "不支持删除或操作失败",
		"en-US": "Delete not supported or failed"
	},
	"result.failed.to.delete.role": {
		"zh-CN": "删除角色失败",
		"en-US": "Failed to delete role"
	},
	"result.missing.guildid.userid.or.roleid": {
		"zh-CN": "缺少 GuildId、UserId 或 RoleId",
		"en-US": "Missing GuildId, UserId or RoleId"
	},
	"result.assign.not.supported.or.failed": {
		"zh-CN": "不支持分配角色或操作失败",
		"en-US": "Assign not supported or failed"
	},
	"result.failed.to.assign.role": {
		"zh-CN": "分配角色失败",
		"en-US": "Failed to assign role"
	},
	"result.remove.not.supported.or.failed": {
		"zh-CN": "不支持移除或操作失败",
		"en-US": "Remove not supported or failed"
	},
	"result.failed.to.remove.role": {
		"zh-CN": "移除角色失败",
		"en-US": "Failed to remove role"
	},
	"result.invalid.val.val.must.be.a.non.empty.array": {
		"zh-CN": "val 必须是非空数组",
		"en-US": "Invalid val: val must be a non-empty array"
	},
	"result.missing.messageid": {
		"zh-CN": "缺少 MessageId",
		"en-US": "Missing MessageId"
	},
	"result.failed.to.delete.message": {
		"zh-CN": "删除消息失败",
		"en-US": "Failed to delete message"
	},
	"result.missing.messageid.or.channelid": {
		"zh-CN": "缺少 MessageId 或 ChannelId",
		"en-US": "Missing MessageId or ChannelId"
	},
	"result.edit.not.supported.or.failed": {
		"zh-CN": "不支持编辑或操作失败",
		"en-US": "Edit not supported or failed"
	},
	"result.failed.to.edit.message": {
		"zh-CN": "编辑消息失败",
		"en-US": "Failed to edit message"
	},
	"result.pin.not.supported.or.failed": {
		"zh-CN": "不支持置顶或操作失败",
		"en-US": "Pin not supported or failed"
	},
	"result.failed.to.pin.message": {
		"zh-CN": "置顶消息失败",
		"en-US": "Failed to pin message"
	},
	"result.unpin.not.supported.or.failed": {
		"zh-CN": "不支持取消置顶或操作失败",
		"en-US": "Unpin not supported or failed"
	},
	"result.failed.to.unpin.message": {
		"zh-CN": "取消消息置顶失败",
		"en-US": "Failed to unpin message"
	},
	"result.get.message.not.supported.or.failed": {
		"zh-CN": "不支持获取消息或操作失败",
		"en-US": "Get message not supported or failed"
	},
	"result.failed.to.get.message": {
		"zh-CN": "获取消息失败",
		"en-US": "Failed to get message"
	},
	"result.successfully.retrieved.member.information": {
		"zh-CN": "成功获取成员信息",
		"en-US": "Successfully retrieved member information"
	},
	"result.no.member.information.found": {
		"zh-CN": "未找到成员信息",
		"en-US": "No member information found"
	},
	"result.failed.to.get.member.information": {
		"zh-CN": "获取成员信息失败",
		"en-US": "Failed to get member information"
	},
	"result.successfully.retrieved.member.list": {
		"zh-CN": "成功获取成员列表",
		"en-US": "Successfully retrieved member list"
	},
	"result.no.member.list.found": {
		"zh-CN": "未找到成员列表",
		"en-US": "No member list found"
	},
	"result.failed.to.get.member.list": {
		"zh-CN": "获取成员列表失败",
		"en-US": "Failed to get member list"
	},
	"result.missing.guildid.or.userid": {
		"zh-CN": "缺少 GuildId 或 UserId",
		"en-US": "Missing GuildId or UserId"
	},
	"result.kick.not.supported.or.failed": {
		"zh-CN": "不支持移除成员或操作失败",
		"en-US": "Kick not supported or failed"
	},
	"result.failed.to.kick.member": {
		"zh-CN": "移除成员失败",
		"en-US": "Failed to kick member"
	},
	"result.ban.not.supported.or.failed": {
		"zh-CN": "不支持封禁或操作失败",
		"en-US": "Ban not supported or failed"
	},
	"result.failed.to.ban.member": {
		"zh-CN": "封禁成员失败",
		"en-US": "Failed to ban member"
	},
	"result.unban.not.supported.or.failed": {
		"zh-CN": "不支持解除封禁或操作失败",
		"en-US": "Unban not supported or failed"
	},
	"result.failed.to.unban.member": {
		"zh-CN": "解除成员封禁失败",
		"en-US": "Failed to unban member"
	},
	"result.missing.guildid.or.keyword": {
		"zh-CN": "缺少 GuildId 或 keyword",
		"en-US": "Missing GuildId or keyword"
	},
	"result.member.search.not.supported.or.failed": {
		"zh-CN": "不支持搜索成员或操作失败",
		"en-US": "Member search not supported or failed"
	},
	"result.failed.to.search.members": {
		"zh-CN": "搜索成员失败",
		"en-US": "Failed to search members"
	},
	"result.failed.to.mute.member": {
		"zh-CN": "禁言成员失败",
		"en-US": "Failed to mute member"
	},
	"result.admin.set.not.supported.or.failed": {
		"zh-CN": "不支持设置管理员或操作失败",
		"en-US": "Admin set not supported or failed"
	},
	"result.failed.to.set.admin": {
		"zh-CN": "设置管理员失败",
		"en-US": "Failed to set admin"
	},
	"result.card.set.not.supported.or.failed": {
		"zh-CN": "不支持设置名片或操作失败",
		"en-US": "Card set not supported or failed"
	},
	"result.failed.to.set.member.card": {
		"zh-CN": "设置成员名片失败",
		"en-US": "Failed to set member card"
	},
	"result.title.set.not.supported.or.failed": {
		"zh-CN": "不支持设置头衔或操作失败",
		"en-US": "Title set not supported or failed"
	},
	"result.failed.to.set.member.title": {
		"zh-CN": "设置成员头衔失败",
		"en-US": "Failed to set member title"
	},
	"result.missing.flag": {
		"zh-CN": "缺少 flag",
		"en-US": "Missing flag"
	},
	"result.friend.request.handling.not.supported.or.failed": {
		"zh-CN": "不支持处理好友请求或操作失败",
		"en-US": "Friend request handling not supported or failed"
	},
	"result.failed.to.handle.friend.request": {
		"zh-CN": "处理好友请求失败",
		"en-US": "Failed to handle friend request"
	},
	"result.missing.flag.or.subtype": {
		"zh-CN": "缺少 flag 或 subType",
		"en-US": "Missing flag or subType"
	},
	"result.guild.request.handling.not.supported.or.failed": {
		"zh-CN": "不支持处理入群请求或操作失败",
		"en-US": "Guild request handling not supported or failed"
	},
	"result.failed.to.handle.guild.request": {
		"zh-CN": "处理入群请求失败",
		"en-US": "Failed to handle guild request"
	},
	"result.successfully.retrieved.channel.info": {
		"zh-CN": "成功获取频道信息",
		"en-US": "Successfully retrieved channel info"
	},
	"result.no.channel.info.found": {
		"zh-CN": "未找到频道信息",
		"en-US": "No channel info found"
	},
	"result.failed.to.get.channel.info": {
		"zh-CN": "获取频道信息失败",
		"en-US": "Failed to get channel info"
	},
	"result.successfully.retrieved.channel.list": {
		"zh-CN": "成功获取频道列表",
		"en-US": "Successfully retrieved channel list"
	},
	"result.no.channel.list.found": {
		"zh-CN": "未找到频道列表",
		"en-US": "No channel list found"
	},
	"result.failed.to.get.channel.list": {
		"zh-CN": "获取频道列表失败",
		"en-US": "Failed to get channel list"
	},
	"result.channel.created": {
		"zh-CN": "频道创建成功",
		"en-US": "Channel created"
	},
	"result.failed.to.create.channel": {
		"zh-CN": "创建频道失败",
		"en-US": "Failed to create channel"
	},
	"result.failed.to.update.channel": {
		"zh-CN": "更新频道失败",
		"en-US": "Failed to update channel"
	},
	"result.failed.to.delete.channel": {
		"zh-CN": "删除频道失败",
		"en-US": "Failed to delete channel"
	},
	"result.missing.channelid.or.userid": {
		"zh-CN": "缺少 ChannelId 或 UserId",
		"en-US": "Missing ChannelId or UserId"
	},
	"result.permission.get.not.supported.or.failed": {
		"zh-CN": "不支持获取权限或操作失败",
		"en-US": "Permission get not supported or failed"
	},
	"result.failed.to.get.permission": {
		"zh-CN": "获取权限失败",
		"en-US": "Failed to get permission"
	},
	"result.permission.set.not.supported.or.failed": {
		"zh-CN": "不支持设置权限或操作失败",
		"en-US": "Permission set not supported or failed"
	},
	"result.failed.to.set.permission": {
		"zh-CN": "设置权限失败",
		"en-US": "Failed to set permission"
	},
	"result.missing.interactionid": {
		"zh-CN": "缺少 InteractionId",
		"en-US": "Missing InteractionId"
	},
	"result.interaction.acknowledgement.is.not.supported": {
		"zh-CN": "不支持确认交互",
		"en-US": "Interaction acknowledgement is not supported"
	},
	"result.failed.to.acknowledge.interaction": {
		"zh-CN": "确认交互失败",
		"en-US": "Failed to acknowledge interaction"
	},
	"result.successfully.retrieved.bot.information": {
		"zh-CN": "成功获取机器人信息",
		"en-US": "Successfully retrieved bot information"
	},
	"result.no.bot.information.found": {
		"zh-CN": "未找到机器人信息",
		"en-US": "No bot information found"
	},
	"result.failed.to.get.bot.information": {
		"zh-CN": "获取机器人信息失败",
		"en-US": "Failed to get bot information"
	},
	"result.successfully.checked.whether.the.bot.was.mentioned": {
		"zh-CN": "已检查是否提及机器人",
		"en-US": "Successfully checked whether the bot was mentioned"
	},
	"result.use.media.send.for.message.delivery.options": {
		"zh-CN": "请使用 media.send 设置消息发送选项",
		"en-US": "Use media.send for message delivery options"
	},
	"result.provide.exactly.one.media.source": {
		"zh-CN": "请提供且仅提供一个媒体来源",
		"en-US": "Provide exactly one media source"
	},
	"result.media.upload.not.supported.or.failed": {
		"zh-CN": "不支持上传媒体或操作失败",
		"en-US": "Media upload not supported or failed"
	},
	"result.failed.to.upload.media": {
		"zh-CN": "上传媒体失败",
		"en-US": "Failed to upload media"
	},
	"result.invalid.media.source.or.conflicting.channel.target": {
		"zh-CN": "媒体来源无效或频道目标冲突",
		"en-US": "Invalid media source or conflicting channel target"
	},
	"result.media.send.not.supported.or.failed": {
		"zh-CN": "不支持发送媒体或操作失败",
		"en-US": "Media send not supported or failed"
	},
	"result.failed.to.send.media.to.channel": {
		"zh-CN": "向频道发送媒体失败",
		"en-US": "Failed to send media to channel"
	},
	"result.invalid.media.source.or.conflicting.user.target": {
		"zh-CN": "媒体来源无效或用户目标冲突",
		"en-US": "Invalid media source or conflicting user target"
	},
	"result.missing.userid": {
		"zh-CN": "缺少 UserId",
		"en-US": "Missing UserId"
	},
	"result.failed.to.send.media.to.user": {
		"zh-CN": "向用户发送媒体失败",
		"en-US": "Failed to send media to user"
	},
	"result.missing.targetid": {
		"zh-CN": "缺少 targetId",
		"en-US": "Missing targetId"
	},
	"result.failed.to.send.media": {
		"zh-CN": "发送媒体失败",
		"en-US": "Failed to send media"
	},
	"result.successfully.retrieved.user.info": {
		"zh-CN": "成功获取用户信息",
		"en-US": "Successfully retrieved user info"
	},
	"result.no.user.info.found": {
		"zh-CN": "未找到用户信息",
		"en-US": "No user info found"
	},
	"result.failed.to.get.user.info": {
		"zh-CN": "获取用户信息失败",
		"en-US": "Failed to get user info"
	},
	"result.retrieved.successfully": {
		"zh-CN": "获取成功",
		"en-US": "Retrieved successfully"
	},
	"result.api.request.timed.out": {
		"zh-CN": "接口超时",
		"en-US": "API request timed out"
	},
	"result.chatbot.client.is.not.available": {
		"zh-CN": "机器人客户端不可用",
		"en-US": "Chatbot client is not available"
	},
	"result.action.timed.out": {
		"zh-CN": "行为超时",
		"en-US": "Action timed out"
	},
	"result.api.processing.failed": {
		"zh-CN": "接口处理错误",
		"en-US": "API processing failed"
	},
	"result.action.processing.failed": {
		"zh-CN": "消费处理错误",
		"en-US": "Action processing failed"
	},
	"http.appUnavailable": {
		"zh-CN": "应用未注册或未启用",
		"en-US": "Application is not registered or enabled"
	},
	"http.appLoading": {
		"zh-CN": "应用正在初始化",
		"en-US": "Application is initializing"
	},
	"http.appFailed": {
		"zh-CN": "应用生命周期失败",
		"en-US": "Application lifecycle failed"
	},
	"http.appDisposed": {
		"zh-CN": "应用已卸载或已结束服务",
		"en-US": "Application has been unloaded or stopped"
	},
	"http.capabilityUnavailable": {
		"zh-CN": "应用未提供对应服务能力",
		"en-US": "Application does not provide this capability"
	},
	"http.routerFailed": {
		"zh-CN": "处理 Koa Router 请求时发生错误。",
		"en-US": "Failed to process router request."
	},
	"http.packageFailed": {
		"zh-CN": "加载 package.json 时发生错误。",
		"en-US": "Failed to load package.json."
	},
	"http.invalidPath": {
		"zh-CN": "非法路径",
		"en-US": "Invalid path"
	},
	"http.resourceFailed": {
		"zh-CN": "加载资源时发生服务器错误。",
		"en-US": "Server error while loading resources."
	},
	"http.frontendMissing": {
		"zh-CN": "前端尚未构建",
		"en-US": "Frontend has not been built"
	},
	"http.online": {
		"zh-CN": "服务在线",
		"en-US": "Service online"
	},
	"http.apps": {
		"zh-CN": "运行时应用列表",
		"en-US": "Runtime applications"
	},
	"http.appMissing": {
		"zh-CN": "应用未注册",
		"en-US": "Application is not registered"
	},
	"http.app": {
		"zh-CN": "运行时应用",
		"en-US": "Runtime application"
	},
	"http.entryMissing": {
		"zh-CN": "没有主要入口文件",
		"en-US": "No main entry file"
	},
	"http.entryNotFound": {
		"zh-CN": "未找到主要入口文件",
		"en-US": "Main entry file not found"
	},
	"http.apiFailed": {
		"zh-CN": "处理 API 请求时发生错误。",
		"en-US": "Failed to process API request."
	},
	"http.resourceNotFound": {
		"zh-CN": "资源中未找到。",
		"en-US": "Resource not found."
	},
	"http.invalidApp": {
		"zh-CN": "无效的应用名称",
		"en-US": "Invalid application name"
	},
	"http.appResourceFailed": {
		"zh-CN": "加载子应用 '{app}' 资源时发生服务器错误。",
		"en-US": "Server error while loading resources for application '{app}'."
	},
	"http.apiNotFound": {
		"zh-CN": "API '{path}' 未找到。",
		"en-US": "API '{path}' not found."
	},
	"http.routeNotFound": {
		"zh-CN": "API 'route/{path}' 未找到。",
		"en-US": "API 'route/{path}' not found."
	},
	"http.appResourceNotFound": {
		"zh-CN": "资源 '{resource}' 在子应用 '{app}' 中未找到。",
		"en-US": "Resource '{resource}' not found in application '{app}'."
	},
	"action.unsupported": {
		"zh-CN": "不支持操作 {action}",
		"en-US": "{action} is not supported"
	},
	"action.failed": {
		"zh-CN": "操作 {action} 失败",
		"en-US": "{action} failed"
	}
};
const languageScope = new AsyncLocalStorage();
/** Unknown or missing languages fall back to Chinese. */
function getLanguage() {
	return languageScope.getStore() ?? (getConfigValue().language === "en-US" ? "en-US" : "zh-CN");
}
/** Override the language for this callback, including asynchronous work, without affecting other requests. */
function withLanguage(language, callback) {
	return languageScope.run(language === "en-US" ? "en-US" : "zh-CN", callback);
}
/** Resolve framework copy at use time so configuration reloads take effect. */
function translate(key, params = {}) {
	return messages[key][getLanguage()].replace(/\{(\w+)\}/g, (token, name) => Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : token);
}

//#endregion
export { getLanguage, translate, withLanguage };