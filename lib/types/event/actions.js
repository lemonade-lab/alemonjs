//#region src/types/event/actions.ts
let ActionsEventEnum = /* @__PURE__ */ function(ActionsEventEnum) {
	ActionsEventEnum["MessageRecall"] = "message.recall";
	ActionsEventEnum["MessageDelete"] = "message.delete";
	ActionsEventEnum["MessageCreate"] = "message.create";
	ActionsEventEnum["MessageEdit"] = "message.edit";
	ActionsEventEnum["MessageList"] = "message.list";
	ActionsEventEnum["MessageTop"] = "message.top";
	ActionsEventEnum["MessageUntop"] = "message.untop";
	ActionsEventEnum["MessageLike"] = "message.like";
	ActionsEventEnum["MessageUnlike"] = "message.unlike";
	ActionsEventEnum["GuildCreate"] = "guild.create";
	ActionsEventEnum["GuildDelete"] = "guild.delete";
	ActionsEventEnum["GuildEdit"] = "guild.edit";
	ActionsEventEnum["GuildQuit"] = "guild.quit";
	ActionsEventEnum["GuildJoin"] = "guild.join";
	ActionsEventEnum["MemberList"] = "member.list";
	ActionsEventEnum["MemberAdd"] = "member.add";
	ActionsEventEnum["MemberDelete"] = "member.delete";
	ActionsEventEnum["MemberEdit"] = "member.edit";
	ActionsEventEnum["RoleAdd"] = "role.add";
	ActionsEventEnum["RoleDelete"] = "role.delete";
	ActionsEventEnum["RoleEdit"] = "role.edit";
	ActionsEventEnum["RoleList"] = "role.list";
	ActionsEventEnum["ChannelCreate"] = "channel.create";
	ActionsEventEnum["ChannelDelete"] = "channel.delete";
	ActionsEventEnum["ChannelEdit"] = "channel.edit";
	ActionsEventEnum["ChannelList"] = "channel.list";
	ActionsEventEnum["CategoryCreate"] = "category.create";
	ActionsEventEnum["CategoryDelete"] = "category.delete";
	ActionsEventEnum["CategoryEdit"] = "category.edit";
	ActionsEventEnum["CategoryList"] = "category.list";
	ActionsEventEnum["MemberKickOut"] = "member.kickOut";
	ActionsEventEnum["MemberBan"] = "member.ban";
	ActionsEventEnum["MemberUnban"] = "member.unban";
	return ActionsEventEnum;
}({});

//#endregion
export { ActionsEventEnum };