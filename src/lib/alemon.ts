import fs from 'fs'
import path from 'path'
/**
 * 递归算法
 * @param dir
 * @param callback
 */
const travel = (dir: any, callback: any) => {
  for (let file of fs.readdirSync(dir)) {
    const pathname = path.join(dir, file)
    if (fs.statSync(pathname).isDirectory()) {
      travel(pathname, callback)
    } else {
      callback(pathname)
    }
  }
}
/**
 * 创建插件应用
 * @param apps 插件合集
 * @param AppName 插件名
 * @param DirName
 * @returns
 */
export const createApps = async (apps: object, AppName: string, DirName: string) => {
  const filepath = `plugins/${AppName}/${DirName}`
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
  arr.forEach(async (item: any) => {
    const AppDir = `${process.cwd()}/${item.replace(/\\/g, '/')}`
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
  return apps
}
