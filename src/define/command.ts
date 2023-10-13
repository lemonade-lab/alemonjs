import { mkdirSync } from 'fs'
import { execSync, exec } from 'child_process'
export async function command(cess: 'execSync' | 'exec', cmd: string) {
  // 错误参数
  if (!cmd) process.exit()
  // 锁定位置
  const dirPath = `./`
  // 没有存在
  mkdirSync(dirPath, { recursive: true })
  console.info('\n')
  try {
    // 切换目录
    process.chdir(dirPath)
    console.info(`[command] ${cmd}`)
    if (cess == 'execSync') {
      execSync(cmd, { stdio: 'inherit' })
    } else if (cess == 'exec') {
      exec(cmd)
    }
  } catch (error) {
    console.info(`${error}`)
    return
  }
}
