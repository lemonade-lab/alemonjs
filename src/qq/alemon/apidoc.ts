/**
 * 此文件方法仅作测试使用
 * 当测试通过时将会放置AMessage
 * 开发者在测试时若该接口测试完毕
 * 可仓库提交详细信息以升级AMessage
 */
import { IGuild, IChannel, IMember, IOpenAPI } from 'qq-guild-bot'

declare global {
  var clientApiByQQ: IOpenAPI
}

/**
 * **********
 * 频道api
 * ************
 */

/**
 * 获取当前用户下的所有频道列表
 * @returns
 */
export const getGuildList = async (): Promise<boolean | IGuild[]> => {
  return await clientApiByQQ.meApi.meGuilds().then(res => {
    const { data } = res
    return data
  })
}

/**
 * 获取频道详情
 * @param guildId
 * **************
id	string	频道 ID
name	string	频道名称
owner_id	string	创建人用户 ID
owner	boolean	当前人是否是创建人
member_count	number	成员数
max_members	number	最大成员数
description	string	描述
 */
export const getGuildMsg = async (
  guildId: string
): Promise<boolean | IGuild> => {
  return await clientApiByQQ.guildApi.guild(guildId).then(res => {
    const { data } = res
    return data
  })
}

/**
 * *****************
 * 子频道api
 * *****************
 */

/**
 * 获取子频道列表
 * @param guildId 
 * @returns 
 * ***********
id	string	子频道 ID
guild_id	string	频道 ID
name	string	子频道名
type	number	子频道类型 ChannelType
sub_type	number	子频道子类型 ChannelSubType
position	number	排序，非必填
parent_id	string	分组 ID
owner_id	string	创建人 ID
 */
export const getChannels = async (
  guildId: string
): Promise<boolean | IChannel[]> => {
  return await clientApiByQQ.channelApi.channels(guildId).then(res => {
    const { data } = res
    return data
  })
}
/**
 * 获取子频道详情
 * @param channelId 
 * @returns 
id	string	子频道 ID
guild_id	string	频道 ID
name	string	子频道名
type	number	子频道类型 ChannelType
sub_type	number	子频道子类型 ChannelSubType
position	number	排序，非必填
parent_id	string	分组 ID
owner_id	string	创建人 ID
 */
export const getChannel = async (
  channelId: string
): Promise<boolean | IChannel> => {
  return await clientApiByQQ.channelApi.channel(channelId).then(res => {
    const { data } = res
    return data
  })
}

/**
 * ***********
 * 仅私域可用,毫无用处
 * ***********
 * 创建子频道
 * 修改子频道
 * 删除子频道
 */

/**
 * ********
 * 成员api
 * **********
 */

/***
 * 获取频道下的成员列表:仅私域可用
 */

/**
 *获取频道下某个成员的信息
 * @param guildId 频道
 * @param userId 用户
 * @returns
 * 次功能已在e消息中携带
 */
export const getGuildMemberMsg = async (
  guildId: string,
  userId: string
): Promise<boolean | IMember> => {
  return await clientApiByQQ.guildApi.guildMember(guildId, userId).then(res => {
    const { data } = res
    return data
  })
}

/**
 * 移除频道的某个成员
 * 仅私域
 */

/**
 * 用于获取 channelID 指定的语音子频道中，所有在线成员的详情列表
 * 仅私域
 */

/**
 * ***************
 * 频道身份组api
 * ***********
 */

/**
 * **********
 * 子频道权限api
 * *********
 * /


/**
 * *******
 * 消息api
 * *****
 */

/**
 * 撤回指定消息
 * @param channelID
 * @param messageID
 * @param hideTip 是否隐藏
 * @returns
 */
export const deleteMsg = async (
  channelID: string,
  messageID: string,
  hideTip?: boolean
): Promise<any> => {
  return await clientApiByQQ.messageApi
    .deleteMessage(channelID, messageID, hideTip)
    .then(res => {
      const { data } = res
      return data
    })
}

/**
 * *******
 * 私信api
 * ********
 */

/**
 * ******
 * 群精华api
 * ********
 */

/**
 * *****
 * 日程api
 * *****
 */

/**
 * *******
 *音频api
 * ******
 */

/**
 * ******
 * 禁言api
 * ****
 */

/**
 * ***********
 * 权限接口api
 * ********
 */
