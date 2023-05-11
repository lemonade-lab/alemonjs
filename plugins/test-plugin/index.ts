import { AppName } from './app.config'
import { travel } from './app.file'
/** 功能 */
const apps = {}
/** 插件位置 */
const place = `plugins/${AppName}`
/** 识别目录 */
const filepath = `./${place}/apps`
/** 路径集 */
const arr: string[] = []
/** 递归筛选文件 */
travel(filepath, (item: any) => {
  if (item.search('.ts') != -1) {
    arr.push(item)
  }
  if (item.search('.js') != -1) {
    arr.push(item)
  }
})
/** 循环处理并合并为apps */
arr.forEach(async (item: any) => {
  const AppDir = `.${item.replace(/\\/g, '/').replace(place, '')}`
  const classObject = await import(AppDir)
  for (const item in classObject) {
    if (classObject[item].prototype) {
      if (apps.hasOwnProperty(item)) {
        console.error(`[同名class export]  ${AppDir}`)
      }
      apps[item] = classObject[item]
    } else {
      console.error(`[非class export]  ${AppDir}`)
    }
  }
})
export { apps }
