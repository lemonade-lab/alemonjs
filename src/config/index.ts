import { getYaml } from 'alemon'
import { join } from 'path'
import { existsSync, copyFileSync } from 'fs'
import { ConfigType } from '../alemon/types'
export const defaultLoginConfigPath = 'config_default/login.yaml'
export const configLoginPath = 'config/login.yaml'
export const defaultConfigPath = 'config_default/app.yaml'
export const configPath = 'config/app.yaml'
if (existsSync(defaultConfigPath) && !existsSync(configPath)) {
  copyFileSync(defaultConfigPath, configPath)
}
const AppConfig: ConfigType = getYaml(join(process.cwd(), defaultConfigPath))
export { AppConfig }
