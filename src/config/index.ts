import { getYaml } from 'alemon'
import { join } from 'path'
import { existsSync, cpSync } from 'fs'
import { ConfigType } from '../alemon/types'
export const defaultConfigLoginPath = 'config_default/login.yaml'
export const configLoginPath = 'config/login.yaml'
export const defaultConfigPath = 'config_default/app.yaml'
export const configPath = 'config/app.yaml'
if (existsSync(defaultConfigPath) && !existsSync(configPath)) {
  cpSync(defaultConfigPath, configPath, {
    recursive: true
  })
}
const AppConfig: ConfigType = getYaml(join(process.cwd(), defaultConfigPath))
export { AppConfig }
