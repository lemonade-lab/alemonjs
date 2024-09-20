// 获得当前目录
import { fileURLToPath } from 'url'
import { dirname, join } from 'node:path'
import fs from 'node:fs'
// 获得当前目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
export default () => {
  // 写编译器，对所有应用进行编译
  // 所有应用目录的绝对路径
  const files = fs
    .readdirSync(join(__dirname, 'apps'), { withFileTypes: true })
    .filter(item => item.isFile())
  return {
    files,
    __dirname
  }
}
