import { mkdirSync } from 'fs'
import { execSync } from 'child_process'
export async function command(cmd: string) {
  // 错误参数
  if (!cmd) process.exit()
  // 锁定位置
  const dirPath = `./`
  // 没有存在
  mkdirSync(dirPath, { recursive: true })
  console.log('\n')
  try {
    // 切换目录
    process.chdir(dirPath)
    console.log(`[command] ${cmd}`)
    execSync(cmd, { stdio: 'inherit' })
  } catch (error) {
    console.log(`${error}`)
    return
  }
}
