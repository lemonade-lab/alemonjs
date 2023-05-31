import { resolve } from 'path'
import { dealTpl } from './template'

/*  插件名字 */
export const AppName = 'point-plugin'

/* 插件路径 */
const baseFile = `${resolve().replace(/\\/g, '/')}/plugins/${AppName}`

/* 选择调试文件并重启 */
const tplFile = `${baseFile}/resources/html/help/help.html`

/* 直接那一份假数据 */
const data = {
  body: [
    {
      group: '原神相关',
      list: [
        {
          icon: 14,
          title: '/原神黄历',
          desc: '今日看黄历没有'
        }
      ]
    }
  ],
  name: 'alemon',
  version: '~1.2.3'
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
