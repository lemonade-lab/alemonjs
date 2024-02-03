/**
 * **********
 * 机器人启动集
 * **********
 */
export const RebotMap = {
  qq: async () => (await import('../platform/qq/index.js')).default(),
  villa: async () => (await import('../platform/villa/index.js')).default(),
  kook: async () => (await import('../platform/kook/index.js')).default(),
  ntqq: async () => (await import('../platform/ntqq/index.js')).default(),
  discord: async () => (await import('../platform/discord/index.js')).default()
}
