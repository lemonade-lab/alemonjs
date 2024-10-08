import { Text, useParse, useSend } from 'alemonjs'
import { readFileSync } from 'node:fs'
import { slice, isEmpty } from 'lodash-es'
import moment from 'moment'

let lineNum = 100
let maxNum = 1000
let errFile = 'logs/error.log'
let logFile = `logs/command.${moment().format('YYYY-MM-DD')}.log`
let keyWord = null

/**
 * @param logFile
 * @returns
 */
function getLog(logFile: string) {
  const data = readFileSync(logFile, { encoding: 'utf-8' })
  let log = data.split('\n')
  if (keyWord) {
    for (const i in log) if (!log[i].includes(keyWord)) delete log[i]
  } else {
    log = slice(log, (Number(lineNum) + 1) * -1)
  }
  log = log.reverse()
  const tmp = []
  for (let i of log) {
    if (!i) continue
    if (keyWord && tmp.length >= maxNum) return
    i = i.replace(/\x1b[[0-9;]*m/g, '')
    i = i.replace(/\r|\n/, '')
    tmp.push(i)
  }
  return tmp
}

//
export default OnResponse(
  async event => {
    const Send = useSend(event)
    if (event.IsMaster) {
      Send(Text('你不是主人'))
      return
    }
    const text = useParse(event.Megs, 'Text')
    const line = text.match(/\d+/g)
    if (line) {
      lineNum = Number(line[0])
    } else {
      keyWord = text.replace(/^(#|\/)?(运行|错误)?(日志)/, '')
    }
    let lf = logFile
    let type = '运行'
    if (text.includes('错误')) {
      lf = errFile
      type = '错误'
    }
    if (keyWord) type = keyWord
    const log = getLog(lf)
    if (isEmpty(log)) {
      Send(Text(`暂无相关日志：${type}`))
      return
    }
    Send(Text(log.join('\n')))
  },
  'message.create',
  /^(#|\/)?(运行|错误)?(日志)/
)
