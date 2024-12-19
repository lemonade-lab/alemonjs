import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { mkdirSync, existsSync, readdirSync, lstatSync, rmdirSync, unlinkSync } from 'fs'

// 获取当前模块的目录
const __dirname = dirname(fileURLToPath(import.meta.url))

// 静态目录地址
export const staticDir = join(__dirname, '../static')

export const getStaticPath = (filename: string) => join(staticDir, filename)

// 静态图片存放路径
mkdirSync(staticDir, { recursive: true })

// 清空目录的函数
function clearDirectory(dirPath) {
  if (existsSync(dirPath)) {
    // 读取目录中的所有文件和子目录
    const files = readdirSync(dirPath)
    for (const file of files) {
      const currentPath = join(dirPath, file)
      if (lstatSync(currentPath).isDirectory()) {
        // 如果是目录，递归清空
        clearDirectory(currentPath)
        rmdirSync(currentPath) // 删除空目录
      } else {
        // 如果是文件，删除文件
        unlinkSync(currentPath)
      }
    }
  }
}
// 每次重启，都要先清空 static
clearDirectory(staticDir)
