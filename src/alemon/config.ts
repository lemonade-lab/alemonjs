import { getYaml } from 'alemon'
import { join } from 'path'
import { existsSync, copyFileSync } from 'fs'
import { ConfigType } from './types'
export const defaultConfigPath = 'config_default/app.yaml'
export const configPath = 'config/app.yaml'
if (existsSync(defaultConfigPath) && !existsSync(configPath)) {
  copyFileSync(defaultConfigPath, configPath)
}
const AppConfig: ConfigType = getYaml(join(process.cwd(), defaultConfigPath))
export { AppConfig }
