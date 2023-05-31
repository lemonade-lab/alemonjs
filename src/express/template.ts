import { readFileSync } from 'fs'
import template from 'art-template'
type DataTyoe = {
  tplFile: string
  pluResPath: string
  version: string
}
export const dealTpl = (data: DataTyoe) => {
  let { tplFile } = data
  try {
    const tpl = readFileSync(tplFile, 'utf8')
    return template.render(tpl, data)
  } catch (error) {
    console.error(`[加载html错误]${tplFile}`, error)
    console.info('未安装测试插件~无法进行示例启动')
    console.info('未安装测试插件~无法进行示例启动')
    console.info('未安装测试插件~无法进行示例启动')
    return false
  }
}
