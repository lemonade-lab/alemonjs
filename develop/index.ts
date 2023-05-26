import { resolve } from 'path'
import { dealTpl } from './template'

/*  插件名字 */
export const AppName = 'point-plugin'

/* 插件路径 */
const baseFile = `${resolve().replace(/\\/g, '/')}/plugins/${AppName}`

/* 选择调试文件并重启 */
const tplFile = `${baseFile}/resources/html/version/version.html`

/* 直接那一份假数据 */
const data = {
  botname: 'Alemon-Bot',
  version: 'V1.0.0',
  center: [
    {
      sub: 'V1.0.1',
      content: ['-优化插件类,并增加JS继承实例']
    },
    {
      sub: 'V1.0.0',
      content: ['-增加pm2运行管理、']
    }
  ]
}

export const getData = () => {
  return dealTpl({
    /** heml路径 */
    tplFile,
    /** 内置路径 */
    pluResPath: ``,
    /** 数据 */
    ...data
  })
}
