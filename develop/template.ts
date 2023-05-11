import fs from 'fs'
import template from 'art-template'
type DataTyoe = {
  tplFile: string
  pluResPath: string
  version: string
}
export const dealTpl = (data: DataTyoe) => {
  let { tplFile } = data
  try {
    const tpl = fs.readFileSync(tplFile, 'utf8')
    return template.render(tpl, data)
  } catch (error) {
    console.error(`[加载html错误]${tplFile}`, error)
    return false
  }
}
