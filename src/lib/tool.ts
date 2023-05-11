import { readFileSync, existsSync } from 'fs'
import { exec } from 'child_process'
import { parse } from 'yaml'

/**
 * 执行指令
 * @param command
 * @returns
 */
export function exe(command: string) {
  return new Promise(resolve => {
    exec(command, (err, stdout) => {
      if (err) {
        console.info(err)
        process.exit()
      } else {
        resolve(stdout)
      }
    })
  })
}

/**
 * 读取配置
 * @param url
 * @returns
 */
export function readYaml(url: string) {
  /* 是否存在 */
  if (existsSync(url)) {
    /* 读取 */
    const file = readFileSync(url, 'utf8')
    const data = parse(file)
    return data
  } else {
    console.error('[NOFIND]', url)
    return false
  }
}
