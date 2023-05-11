import fs from 'fs'
import path from 'path'
/**
 * 递归算法
 * @param dir
 * @param callback
 */
export const travel = (dir: any, callback: any) => {
  for (let file of fs.readdirSync(dir)) {
    const pathname = path.join(dir, file)
    if (fs.statSync(pathname).isDirectory()) {
      travel(pathname, callback)
    } else {
      callback(pathname)
    }
  }
}
