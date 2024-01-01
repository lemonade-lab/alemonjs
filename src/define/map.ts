/**
 * **********
 * 机器人启动集
 * **********
 */
export const RebotMap = {
  qq: async (): Promise<boolean> => {
    const { createAlemonByQQ: qq } = await import('../qq/index.js')
    return qq().catch(err => {
      console.error(err)
      console.error('QQ BOT open err')
      return false
    })
  },
  villa: async (): Promise<boolean> => {
    const { createAlemonByVilla: villa } = await import('../villa/index.js')
    return villa().catch(err => {
      console.error(err)
      console.error('VILLA BOT open err')
      return false
    })
  },
  kook: async (): Promise<boolean> => {
    const { createAlemonByKOOK: kook } = await import('../kook/index.js')
    return kook().catch(err => {
      console.error(err)
      console.error('KOOK BOT open err')
      return false
    })
  },
  ntqq: async (): Promise<boolean> => {
    const { createAlemonByNtqq: ntqq } = await import('../ntqq/index.js')
    return ntqq().catch(err => {
      console.error(err)
      console.error('NTQQ BOT open err')
      return false
    })
  },
  discord: async (): Promise<boolean> => {
    const { createAlemonByDISCORD: discord } = await import(
      '../discord/index.js'
    )
    return discord().catch(err => {
      console.error(err)
      console.error('DISCORD BOT open err')
      return false
    })
  }
}
