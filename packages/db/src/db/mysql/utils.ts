import { appendFile, mkdirSync } from 'fs'
import { join } from 'path'
import dayjs from 'dayjs'
const dir = join(process.cwd(), 'logs', 'mysql')
export const logging = (sql: string) => {
  mkdirSync(dir, { recursive: true })
  const TIME = dayjs().format('YYYY-MM-DD')
  const time = dayjs().format('YYYY-MM-DD HH:mm:ss')
  appendFile(join(dir, `${TIME}.log`), `${time}\n${sql}\n`, err => {
    if (err) {
      console.error('Error writing to log file:', err)
    }
  })
  return false
}
