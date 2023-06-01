/**
 * 此文件方法暂不可用,仅作测试
 */

/**
 * 获得频道列表
 * @returns
 */
export const getGuildList = async () => {
  const data = await client.meApi
    .meGuilds()
    .then(res => {
      const { data } = res
      return data
    })
    .catch(err => {
      console.error(err)
      return false
    })
  return data
}

/**
 * 得到频道详细信息
 * @param guildId
 */
export const getGuildMsg = async (guildId: string) => {
  const data = await client.guildApi
    .guild(guildId)
    .then(res => {
      const { data } = res
      return data
    })
    .catch(err => {
      console.error(err)
      return false
    })
  return data
}

/**
 *
 * @param guildId 频道
 * @param userId 用户
 * @returns
 */
export const getGuildMemberMsg = async (guildId: string, userId: string) => {
  const data = await client.guildApi
    .guildMember(guildId, userId)
    .then(res => {
      const { data } = res
      return data
    })
    .catch(err => {
      console.error(err)
      return false
    })
  return data
}

/**
 * 得到子频道详细信息
 * @param channelId
 * @returns
 */
export const getChannelMsg = async (channelId: string) => {
  const data = await client.channelApi
    .channel(channelId)
    .then(res => {
      const { data } = res
      return data
    })
    .catch(err => {
      console.error(err)
      return false
    })
  return data
}
