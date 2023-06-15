import { getYaml } from 'alemon'
import { join } from 'path'
import { existsSync, cpSync } from 'fs'
import { ConfigType } from '../alemon/types'
export const defaultConfigLoginPath = 'config_default/login.yaml'
export const configLoginPath = 'config/login.yaml'
export const defaultConfigPath = 'config_default/app.yaml'
export const configPath = 'config/app.yaml'
/* 检查应用配置 */
if (existsSync(defaultConfigPath) && !existsSync(configPath)) {
  cpSync(defaultConfigPath, configPath, {
    recursive: true
  })
}
/* 读取生成后的配置 */
const AppConfig: ConfigType = getYaml(join(process.cwd(), configPath))
export { AppConfig }
