import { buildAndRun } from './build/rullup.js'
import { initConfig } from './store.js'

/**
 * @param input
 */
const onDev = async () => {
  const apps = []
  // 修改config
  for (const plugin of global.lvyConfig.plugins) {
    if (plugin?.config) {
      const cfg = await plugin.config(global.lvyConfig)
      global.lvyConfig = {
        ...global.lvyConfig,
        ...cfg
      }
    }
    apps.push(plugin)
  }
  // 执行loader
  await import('./loader/main.js')
  // 执行callback
  for (const app of apps) {
    if (app?.callback) await app.callback()
  }
}

/**
 *
 * @param input
 * @param ouput
 */
const onBuild = () => {
  buildAndRun('src', 'lib')
}

const main = async () => {
  if (process.argv.includes('--lvy-dev')) {
    await initConfig()
    onDev()
  } else if (process.argv.includes('--lvy-build')) {
    await initConfig()
    onBuild()
  }
}

main()

export { defineConfig } from './store.js'
