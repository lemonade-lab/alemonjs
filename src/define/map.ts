/**
 * **********
 * 机器人启动集
 * **********
 */
export const rebotMap = {
  qq: async (): Promise<boolean> => {
    const { createAlemonByQQ: qq } = await import('../qq/index.js')
    return qq().catch(err => {
      console.error(err)
      console.error('[AlemonJS]', 'QQ机器人启动失败~')
      return false
    })
  },
  villa: async (): Promise<boolean> => {
    const { createAlemonByVilla: villa } = await import('../villa/index.js')
    return villa().catch(err => {
      console.error(err)
      console.error('[AlemonJS]', 'Villa机器人启动失败~')
      return false
    })
  },
  kook: async (): Promise<boolean> => {
    const { createAlemonByKOOK: kook } = await import('../kook/index.js')
    return kook().catch(err => {
      console.error(err)
      console.error('[AlemonJS]', 'KOOK机器人启动失败~')
      return false
    })
  },
  ntqq: async (): Promise<boolean> => {
    const { createAlemonByNtqq: ntqq } = await import('../ntqq/index.js')
    return ntqq().catch(err => {
      console.error(err)
      console.error('[AlemonJS]', 'Ntqq机器人启动失败~')
      return false
    })
  }
}
