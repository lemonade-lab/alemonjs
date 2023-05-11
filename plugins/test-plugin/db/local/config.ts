import fs from 'fs'
import { MyDirPath } from '../../app.config'
/* 配置地址 */
const PathConfig = `${MyDirPath}/resources/defset`
/* 得到指定配置的数据 */
export const getConfig = (app: string, name: string) =>
  JSON.parse(fs.readFileSync(`${PathConfig}/${app}/${name}.json`, 'utf8'))
