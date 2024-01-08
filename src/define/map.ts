/**
 * **********
 * 机器人启动集
 * **********
 */
export const RebotMap = {
  qq: async () => {
    const { createAlemon } = await import('../qq/index.js')
    createAlemon().catch(err => {
      console.error(err)
      console.error('QQ BOT open err')
    })
  },
  villa: async () => {
    const { createAlemon } = await import('../villa/index.js')
    createAlemon().catch(err => {
      console.error(err)
      console.error('VILLA BOT open err')
    })
  },
  kook: async () => {
    const { createAlemon } = await import('../kook/index.js')
    createAlemon().catch(err => {
      console.error(err)
      console.error('KOOK BOT open err')
    })
  },
  ntqq: async () => {
    const { createAlemon } = await import('../ntqq/index.js')
    createAlemon().catch(err => {
      console.error(err)
      console.error('NTQQ BOT open err')
    })
  },
  discord: async () => {
    const { createAlemon } = await import('../discord/index.js')
    createAlemon().catch(err => {
      console.error(err)
      console.error('DISCORD BOT open err')
    })
  }
}
