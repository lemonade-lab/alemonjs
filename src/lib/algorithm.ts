import fs from 'fs'
import path from 'path'
/**
 * 判断指定插件是否存在
 * @param name 插件路径名
 * @returns 
 */
export const isPlugin = (name: string): boolean => {
  if (fs.existsSync(`${path.resolve().replace(/\\/g, '/')}/plugins/${name}`)) return true
  return false
}

/**得到该地址的子目录并已数组返回*/
export const getMenuArr = (path: string): string[] => {
  const files = fs.readdirSync(path)
  const shield = ['.git']
  const sum: string[] = []
  files.forEach(item => {
    const newpath = `${path}/${item}`
    const stat = fs.statSync(newpath)
    //不是文件？
    if (!stat.isFile()) {
      //是目录名
      const file = newpath.replace(`${path}/`, '')
      shield.forEach(item => {
        if (item != file) {
          sum.push(file)
        }
      })
    }
  })
  return sum
}

/**得到指定目录下的所有指定类型文件*/
export const getMenuPathType = (menupath: string, type: string): string[] => {
  const travel = (dir: string, callback: any) => {
    fs.readdirSync(dir).forEach(file => {
      let pathname = path.join(dir, file)
      if (fs.statSync(pathname).isDirectory()) {
        travel(pathname, callback)
      } else {
        callback(pathname)
      }
    })
  }
  const newsum: string[] = []
  travel(menupath, (pathname: string) => {
    let temporary = pathname.search(type)
    if (temporary != -1) {
      newsum.push(pathname)
    }
  })
  return newsum
}

/**
 * 读取指令类型文件的数据
 */
export const getPathName = ({ PATH, NAME, TYPE = 'json' }: any) => {
  const DIR = path.join(`${PATH}/${NAME}.${TYPE}`)
  try {
    return JSON.parse(fs.readFileSync(DIR, 'utf8'))
  } catch {
    return false
  }
}

/**
 *写入数据 
 */
export const setPathName = ({ PATH, NAME, TYPE = 'json', DATA }: any) => {
  const DIR = path.join(`${PATH}/${NAME}.${TYPE}`)
  try {
    fs.writeFileSync(DIR, JSON.stringify(DATA, null, '\t'))
    return true
  } catch {
    return false
  }
}

/* 输入需要初始化目录的地址全路径 */
export const ctrateFile = (req: string) => {
  let name = req.split('/')
  let newname = path.resolve().replace(/\\/g, '/')
  name.forEach(item => {
    newname += `${item}/`
    if (!fs.existsSync(`${newname}`)) {
      fs.mkdirSync(`${newname}`)
    }
  })
}

export const ctrateFilePath = (req: string, path: string) => {
  let name = req.split('/')
  let newname = path
  name.forEach(item => {
    newname += `${item}/`
    if (!fs.existsSync(`${newname}`)) {
      fs.mkdirSync(`${newname}`)
    }
  })
}

/**得到该路径的完整路径*/
export const getReq = (req: string) => {
  /* 根据目录初始化地址 */
  ctrateFile(req)
  return path.join(path.resolve().replace(/\\/g, '/'), req)
}
