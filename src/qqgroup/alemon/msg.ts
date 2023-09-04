// icqq
import { segmentIcqq } from '../icqq/segment.js'

export function parseMsg(msg) {
  const regex = /<@(\d+)>/g // 匹配 <@xxx> 格式的字符串
  let match
  let lastIndex = 0
  const arr = []

  while ((match = regex.exec(msg)) !== null) {
    const startIndex = match.index
    const endIndex = regex.lastIndex

    // 提取 <@xxx> 前的部分
    const segmentBefore = msg.slice(lastIndex, startIndex).trim()
    if (segmentBefore.length > 0) {
      arr.push(segmentBefore)
    }

    // 提取 <@xxx> 中的 xxx
    const userId = match[1]

    if (userId == 'everyone') {
      // 这是一个at全体
      arr.push(segmentIcqq.at('all'))
    } else {
      // 根据 userId 调用 segmentIcqq.at() API
      // 生成 @柠檬冲水 表达式，
      // 并添加到数组中
      arr.push(segmentIcqq.at(Number(userId)))
    }

    lastIndex = endIndex
  }

  // 提取最后一个 <@xxx> 后的部分
  const segmentAfter = msg.slice(lastIndex).trim()
  if (segmentAfter.length > 0) {
    arr.push(segmentAfter)
  }

  return arr
}

/**
 * 响应群消息
 */
