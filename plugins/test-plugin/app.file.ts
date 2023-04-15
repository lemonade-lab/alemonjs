import fs from 'fs'
import path from 'path'
export const travel = (dir: any, callback: any) => {
  fs.readdirSync(dir).forEach(file => {
    const pathname = path.join(dir, file)
    if (fs.statSync(pathname).isDirectory()) {
      travel(pathname, callback)
    } else {
      callback(pathname)
    }
  })
}
